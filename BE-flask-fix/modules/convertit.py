import logging
import os
from flask import request, Blueprint, current_app, jsonify
from PyPDF2 import PdfReader
import queue
import shutil
import threading
import torch
import requests
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered
from marker.config.parser import ConfigParser
import uuid

headers = {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
}

logger = logging.getLogger(__name__)
convert_bp = Blueprint('convert', __name__)
task_queue = queue.Queue()

ALLOWED_GROUPS = {'mahasiswa', 'umum'}
MARKDOWN_DIR = os.path.join("data", "uploads", "markdown")
ORIGINAL_DIR = os.path.join("data", "uploads", "original")
TEMP_DIR = os.path.join("data", "uploads", "temp")
CHROMA_DIR = os.path.join("data", "vectorstores")
REBUILD_URL = os.environ.get("REBUILD_URL", "http://localhost:5000/api/rebuild")


def create_directory(path):
    os.makedirs(path, exist_ok=True)


def get_total_pages(pdf_path):
    try:
        with open(pdf_path, 'rb') as f:
            return len(PdfReader(f).pages)
    except Exception:
        logger.exception(f"Gagal menghitung halaman PDF: {pdf_path}")
        raise


def process_pdf(temp_pdf_path, group, nama_dokumen, folder_name, model_dict):
    try:
        logger.info(f"Memulai proses PDF: {temp_pdf_path} untuk grup: {group}")

        filename = os.path.basename(temp_pdf_path)
        pdf_name = os.path.splitext(filename)[0]
        output_dir = os.path.join(MARKDOWN_DIR, group, pdf_name)
        create_directory(output_dir)

        total_pages = get_total_pages(temp_pdf_path)

        for start_page in range(0, total_pages, 5):
            end_page = min(start_page + 4, total_pages - 1)
            config = {
                "output_format": "markdown",
                "disable_image_extraction": "true",
                "output_dir": output_dir,
                "page_range": f"{start_page}-{end_page}",
            }

            config_parser = ConfigParser(config)
            converter = PdfConverter(
                artifact_dict=model_dict,
                config=config_parser.generate_config_dict(),
                processor_list=config_parser.get_processors(),
                renderer=config_parser.get_renderer(),
                llm_service=None
            )

            rendered = converter(temp_pdf_path)
            text, _, _ = text_from_rendered(rendered)

            filename_md = f"{pdf_name}_p{start_page}-{end_page}.md"
            with open(os.path.join(output_dir, filename_md), "w", encoding="utf-8") as f:
                f.write(text)

            del rendered, converter
            torch.cuda.empty_cache()

        # Jika proses convert berhasil, pindahkan PDF dari TEMP ke ORIGINAL
        original_dir = os.path.join(ORIGINAL_DIR, group)
        create_directory(original_dir)
        final_path = os.path.join(original_dir, filename)
        shutil.move(temp_pdf_path, final_path)
        logger.info(f"File PDF berhasil dipindahkan ke: {final_path}")

        # Simpan metadata ke folder meta di ORIGINAL
        meta_dir = os.path.join(original_dir, "meta")
        create_directory(meta_dir)
        meta_path = os.path.join(meta_dir, f"{filename}.meta")
        with open(meta_path, "w", encoding="utf-8") as f:
            f.write(nama_dokumen)

        # TODO: Panggil fungsi rebuild_chroma di sini jika perlu

    except Exception:
        logger.exception(f"Error saat memproses PDF: {temp_pdf_path}")
        # Jika error, hapus file temp jika ada
        if os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
            logger.warning(f"File PDF gagal diproses dan dihapus: {temp_pdf_path}")
        raise

def process_queue():
    model_dict = create_model_dict()
    while True:
        temp_pdf_path, group, nama_dokumen, folder_name = task_queue.get()
        try:
            process_pdf(temp_pdf_path, group, nama_dokumen, folder_name, model_dict)
        except Exception:
            logger.error("Queue error", exc_info=True)
        finally:
            task_queue.task_done()
            # Trigger rebuild vectorstore setelah selesai
            try:
                requests.post(REBUILD_URL, json={"group": group}, headers=headers)
                logger.info(f"Rebuild signal sent for {group}")
            except Exception:
                logger.exception("Failed to send rebuild signal")

@convert_bp.route('/api/convert', methods=['POST'])
def upload_file():
    try:
        group_mapping = {
            'Dokumen_Umum': 'umum',
            'Dokumen_Mahasiswa': 'mahasiswa'
        }

        nama_dokumen = request.form.get('namaDokumen')
        doc_id = str(uuid.uuid4())[:8]
        safe_name = nama_dokumen.replace("/", "_").replace("\\", "_")
        folder_name = f"{safe_name}_{doc_id}"
        file = request.files.get('file')
        jenis = request.form.get('jenisDokumen')

        if not nama_dokumen or not file or not jenis or jenis not in group_mapping:
            logger.warning("Form input tidak valid")
            return jsonify({"error": "Missing or invalid input"}), 400

        group = group_mapping[jenis]
        create_directory(TEMP_DIR)

        # Simpan file PDF di TEMP dulu, belum ke ORIGINAL
        temp_path = os.path.join(TEMP_DIR, f"{folder_name}.pdf")
        file.save(temp_path)
        logger.info(f"File berhasil diunggah ke temp: {temp_path}")

        # Kirim file TEMP ke task queue untuk proses convert dan pembuatan vectorstore
        task_queue.put((temp_path, group, nama_dokumen, folder_name))

        # Tentukan folder output markdown yang akan dibuat nanti di proses
        output_dir = os.path.join(MARKDOWN_DIR, group, folder_name)

        return jsonify({
            "message": "File uploaded and processing started",
            "temp_file": temp_path,
            "output_markdown_dir": output_dir,
            "doc_id": doc_id
        }), 202

    except Exception:
        logger.exception("Gagal mengunggah dan memproses file")
        return jsonify({"error": "Internal server error"}), 500


@convert_bp.route('/api/healthcheck/convert', methods=['GET'])
def healthcheck():
    try:
        status = {
            "status": "ok",
            "temp_dir_exists": os.path.exists(TEMP_DIR),
            "original_dir_exists": os.path.exists(ORIGINAL_DIR),
            "markdown_dir_exists": os.path.exists(MARKDOWN_DIR),
            "chroma_umum_exists": os.path.exists(os.path.join(CHROMA_DIR, "umum")),
            "chroma_mahasiswa_exists": os.path.exists(os.path.join(CHROMA_DIR, "mahasiswa")),
        }
        return jsonify(status), 200
    except Exception as e:
        logger.exception("Healthcheck gagal")
        return jsonify({"status": "error", "error": str(e)}), 500


def start_worker():
    create_directory(ORIGINAL_DIR)
    create_directory(MARKDOWN_DIR)
    create_directory(TEMP_DIR)
    create_directory(CHROMA_DIR)
    for group in ALLOWED_GROUPS:
        create_directory(os.path.join(MARKDOWN_DIR, group))
        create_directory(os.path.join(ORIGINAL_DIR, group))
        create_directory(os.path.join(CHROMA_DIR, f"{group}_chroma"))
    threading.Thread(target=process_queue, daemon=True).start()
