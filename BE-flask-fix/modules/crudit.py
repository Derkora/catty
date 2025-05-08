import os
import shutil
from flask import Blueprint, request, jsonify
import requests
import logging
from modules.convertit import process_pdf
from queue import Queue
import uuid

headers = {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
}

# Inisialisasi task queue
task_queue = Queue()

# Inisialisasi Blueprint dan Logger
crudit_bp = Blueprint('crudit', __name__)
logger = logging.getLogger(__name__)

# Path untuk data
DATA_PATH = "data/uploads"

def initialize_category_rag(category):
    try:
        original_path = os.path.join(DATA_PATH, "original", category)

        if os.path.exists(original_path):
            pdf_files = [f for f in os.listdir(original_path) if f.endswith('.pdf')]
            for pdf in pdf_files:
                pdf_path = os.path.join(original_path, pdf)
                try:
                    logger.info(f"Converting file: {pdf_path} in category {category}")
                    process_pdf(pdf_path, category)
                    task_queue.put((pdf_path, category))
                except Exception as e:
                    logger.error(f"Error converting file {pdf_path}: {e}", exc_info=True)
        else:
            logger.error(f"Original path not found: {original_path}")
    except Exception as e:
        logger.error(f"Error in initialize_category_rag({category}): {e}", exc_info=True)

@crudit_bp.route('/api/upload', methods=['POST'])
def upload_file_nonpdf():
    try:
        file = request.files.get('file')
        nama_dokumen = request.form.get('namaDokumen')
        jenis = request.form.get('jenisDokumen')

        if not file or not nama_dokumen or not jenis:
            return jsonify({"error": "Field tidak lengkap"}), 400

        if file.filename.lower().endswith('.pdf'):
            return jsonify({"error": "Gunakan /api/convert untuk file PDF"}), 400

        group_mapping = {
            'Dokumen_Mahasiswa': 'mahasiswa',
            'Dokumen_Umum': 'umum'
        }

        group = group_mapping.get(jenis)
        if not group:
            return jsonify({"error": "Jenis tidak valid"}), 400

        upload_dir = os.path.join(DATA_PATH, "original", group)
        os.makedirs(upload_dir, exist_ok=True)

        filename = f"{nama_dokumen}_{uuid.uuid4().hex[:8]}{os.path.splitext(file.filename)[1]}"
        save_path = os.path.join(upload_dir, filename)
        file.save(save_path)

        logger.info(f"Non-PDF file uploaded to: {save_path}")
        return jsonify({
            "message": "File berhasil diupload",
            "filename": filename,
            "path": save_path
        }), 201
    except Exception as e:
        logger.exception("Upload non-PDF gagal")
        return jsonify({"error": str(e)}), 500


@crudit_bp.route('/api/files', methods=['GET'])
def list_files():
    try:
        category = request.args.get('category', 'mahasiswa')
        original_path = os.path.join("data", "uploads", "original", category)
        markdown_path = os.path.join("data", "uploads", "markdown", category)
        result = {}

        if not os.path.exists(original_path):
            logger.warning(f"Original path not found: {original_path}")
            return jsonify({"error": "Category not found"}), 404

        all_files = os.listdir(original_path)
        files_grouped = {}

        # Kelompokkan file berdasarkan ekstensi
        for f in all_files:
            ext = os.path.splitext(f)[1].lower().lstrip('.')
            files_grouped.setdefault(ext, []).append(f)

        # Markdown folders
        markdown_folders = []
        if os.path.exists(markdown_path):
            for folder in os.listdir(markdown_path):
                folder_path = os.path.join(markdown_path, folder)
                if os.path.isdir(folder_path):
                    md_files = [f for f in os.listdir(folder_path) if f.endswith('.md')]
                    markdown_folders.append({
                        "folder": folder,
                        "files": md_files
                    })

        result["files_by_type"] = {
            ext: {
                "count": len(files),
                "files": files,
                "links": [
                    f"/static/uploads/original/{category}/{f}" for f in files
                ]
            }
            for ext, files in files_grouped.items()
        }
        result["markdown_folders"] = markdown_folders

        return jsonify(result), 200
    except Exception as e:
        logger.error("Error in list_files():", exc_info=True)
        return jsonify({"error": str(e)}), 500

@crudit_bp.route('/api/files/<folder>', methods=['DELETE'])
def delete_file(folder):
    try:
        category = request.args.get('category', 'mahasiswa')
        original_path = os.path.join(DATA_PATH, "original", category)

        # Cari file PDF yang cocok
        pdf_files = [f for f in os.listdir(original_path) if f.endswith('.pdf')]
        matched_pdf = next((f for f in pdf_files if f.startswith(folder)), None)

        # Cek juga untuk file non-PDF
        all_files = os.listdir(original_path)
        matched_non_pdf = next((f for f in all_files if f.startswith(folder) and not f.endswith('.pdf')), None)

        deleted_pdf = None
        deleted_md_folder = None
        deleted_non_pdf = None

        if matched_pdf:
            # Hapus PDF
            pdf_file_path = os.path.join(original_path, matched_pdf)
            os.remove(pdf_file_path)
            deleted_pdf = matched_pdf
            logger.info(f"Deleted PDF file: {pdf_file_path}")

            # Hapus folder markdown jika ada
            markdown_base = os.path.join(DATA_PATH, "markdown", category)
            for md_folder in os.listdir(markdown_base):
                if md_folder.startswith(folder):
                    markdown_folder_path = os.path.join(markdown_base, md_folder)
                    shutil.rmtree(markdown_folder_path)
                    deleted_md_folder = md_folder
                    logger.info(f"Deleted markdown folder: {markdown_folder_path}")
                    break

        elif matched_non_pdf:
            # Hapus file non-PDF
            file_path = os.path.join(original_path, matched_non_pdf)
            os.remove(file_path)
            deleted_non_pdf = matched_non_pdf
            logger.info(f"Deleted non-PDF file: {file_path}")

        else:
            return jsonify({"error": "File tidak ditemukan"}), 404

        # Jika PDF dihapus → rebuild vector (chroma)
        if deleted_pdf:
            rebuild_url = os.environ.get("REBUILD_URL", "http://localhost:5000/api/rebuild")
            headers = {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            }
            try:
                response = requests.post(rebuild_url, json={"group": category}, headers=headers)
                if response.status_code == 200:
                    logger.info(f"Triggered vector rebuild for category: {category}")
                else:
                    logger.error(f"Failed to trigger rebuild for {category}: {response.text}")
            except Exception as e:
                logger.warning(f"Gagal trigger rebuild untuk {category}: {e}")

        return jsonify({
            "status": "deleted",
            "deleted_pdf": deleted_pdf,
            "deleted_non_pdf": deleted_non_pdf,
            "deleted_md_folder": deleted_md_folder
        }), 200

    except Exception as e:
        logger.error(f"Gagal hapus file {folder} di kategori {category}:", exc_info=True)
        return jsonify({"error": str(e)}), 500

@crudit_bp.route('/api/health/crudit', methods=['GET'])
def health_check_crudit():
    return jsonify({"status": "ok", "service": "crudit"}), 200
