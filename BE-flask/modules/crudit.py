import os
import shutil
from flask import Blueprint, request, jsonify
import requests
import logging
from modules.convertit import process_pdf
from queue import Queue
import uuid
import datetime
import pytz
import re

headers = {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
}

# Inisialisasi task queue
task_queue = Queue()
tz = pytz.timezone("Asia/Jakarta")

# Inisialisasi Blueprint dan Logger
crudit_bp = Blueprint('crudit', __name__)
logger = logging.getLogger(__name__)

# Path untuk data
DATA_PATH = "data/uploads"

def initialize_category_rag(category):
    try:
        original_path = os.path.join(DATA_PATH, "original", category)
        markdown_path = os.path.join(DATA_PATH, "markdown", category)

        # === Proses semua PDF di folder original ===
        if os.path.exists(original_path):
            pdf_files = [f for f in os.listdir(original_path) if f.endswith('.pdf')]
            for pdf in pdf_files:
                pdf_path = os.path.join(original_path, pdf)
                try:
                    logger.info(f"Converting file: {pdf_path} in category {category}")
                    process_pdf(pdf_path, category)  # Proses PDF ke folder sesuai kategori
                    task_queue.put((pdf_path, category))  # Tambahkan ke antrean
                except Exception as e:
                    logger.error(f"Error converting file {pdf_path}: {e}", exc_info=True)
        else:
            logger.warning(f"Original path not found: {original_path}")

        # === Proses semua file .md dari folder markdown ===
        if os.path.exists(markdown_path):
            from modules.chatit import add_documents_to_vectorstore  # Pastikan ini sesuai modulmu
            md_documents = []

            for file in os.listdir(markdown_path):
                file_path = os.path.join(markdown_path, file)
                if os.path.isfile(file_path) and file.endswith('.md'):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        md_documents.append({
                            "content": content,
                            "metadata": {"source": file_path}
                        })

            if md_documents:
                logger.info(f"Menambahkan {len(md_documents)} file markdown ke vectorstore untuk {category}")
                add_documents_to_vectorstore(md_documents, category)  # Menambahkan ke vectorstore berdasarkan kategori

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
        meta_dir = os.path.join(upload_dir, "meta")
        os.makedirs(upload_dir, exist_ok=True)
        os.makedirs(meta_dir, exist_ok=True)

        # Ganti karakter berbahaya dalam nama file
        safe_nama = nama_dokumen.replace("/", "_").replace("\\", "_")
        unique_id = uuid.uuid4().hex[:8]
        ext = os.path.splitext(file.filename)[1]
        filename = f"{safe_nama}_{unique_id}{ext}"
        save_path = os.path.join(upload_dir, filename)

        # Simpan file
        file.save(save_path)

        meta_path = os.path.join(meta_dir, filename + ".meta")
        with open(meta_path, "w", encoding="utf-8") as meta_file:
            diunggah = datetime.datetime.now(tz).strftime('%d %B %Y %H:%M')
            meta_file.write(f"{nama_dokumen}\n{diunggah}")

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
        category = request.args.get('category', 'umum')
        original_path = os.path.join(DATA_PATH, "original", category)
        meta_path = os.path.join(original_path, "meta")
        markdown_path = os.path.join(DATA_PATH, "markdown", category)
        result = {}

        if not os.path.exists(original_path):
            logger.warning(f"Original path not found: {original_path}")
            return jsonify({"error": "Category not found"}), 404

        all_files = os.listdir(original_path)
        files_grouped = {}

        for f in all_files:
            full_path = os.path.join(original_path, f)
            if os.path.isfile(full_path) and not f.endswith('.meta'):
                ext = os.path.splitext(f)[1].lower().lstrip('.')
                base_name = os.path.splitext(f)[0]

                # Cek apakah ada file meta di dalam /meta
                meta_file = f + ".meta"
                meta_file_path = os.path.join(meta_path, meta_file)

                original_name = base_name
                uploaded_time = "-"
                if os.path.exists(meta_file_path):
                    try:
                        with open(meta_file_path, "r", encoding="utf-8") as meta:
                            lines = meta.readlines()
                            if len(lines) >= 2:
                                original_name = lines[0].strip()
                                uploaded_time = lines[1].strip()
                            elif len(lines) == 1:
                                original_name = lines[0].strip()
                    except Exception as e:
                        logger.error(f"Gagal baca .meta file {meta_file_path}: {e}")


                files_grouped.setdefault(ext, []).append({
                    "filename": f,
                    "original_name": original_name,
                    "uploaded": uploaded_time,
                    "link": f"/static/uploads/original/{category}/{f}"
                })

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
                "files": files
            }
            for ext, files in files_grouped.items()
        }

        result["markdown_folders"] = markdown_folders

        return jsonify(result), 200
    except Exception as e:
        logger.error("Error in list_files():", exc_info=True)
        return jsonify({"error": str(e)}), 500

@crudit_bp.route('/api/files/<path:folder>', methods=['DELETE'])
def delete_file(folder):
    try:
        category = request.args.get('category', 'umum')
        original_path = os.path.join(DATA_PATH, "original", category)
        meta_path = os.path.join(original_path, "meta")

        pdf_files = [f for f in os.listdir(original_path) if f.endswith('.pdf')]
        matched_pdf = next((f for f in pdf_files if f.startswith(folder)), None)

        all_files = os.listdir(original_path)
        matched_non_pdf = next((f for f in all_files if f.startswith(folder) and not f.endswith('.pdf')), None)

        deleted_pdf = None
        deleted_md_folder = None
        deleted_non_pdf = None
        deleted_meta_files = []

        if matched_pdf:
            file_path = os.path.join(original_path, matched_pdf)
            os.remove(file_path)
            deleted_pdf = matched_pdf
            logger.info(f"Deleted PDF file: {file_path}")

            meta_file = matched_pdf + ".meta"
            meta_file_path = os.path.join(meta_path, meta_file)
            if os.path.isfile(meta_file_path):
                os.remove(meta_file_path)
                deleted_meta_files.append(meta_file)
                logger.info(f"Deleted meta file: {meta_file_path}")

            # Hapus markdown folder
            markdown_base = os.path.join(DATA_PATH, "markdown", category)
            for md_folder in os.listdir(markdown_base):
                if md_folder.startswith(folder):
                    markdown_folder_path = os.path.join(markdown_base, md_folder)
                    shutil.rmtree(markdown_folder_path)
                    deleted_md_folder = md_folder
                    logger.info(f"Deleted markdown folder: {markdown_folder_path}")
                    break

        elif matched_non_pdf:
            file_path = os.path.join(original_path, matched_non_pdf)
            os.remove(file_path)
            deleted_non_pdf = matched_non_pdf
            logger.info(f"Deleted non-PDF file: {file_path}")

            meta_file = matched_non_pdf + ".meta"
            meta_file_path = os.path.join(meta_path, meta_file)
            if os.path.isfile(meta_file_path):
                os.remove(meta_file_path)
                deleted_meta_files.append(meta_file)
                logger.info(f"Deleted meta file: {meta_file_path}")
        else:
            return jsonify({"error": "File tidak ditemukan"}), 404

        # Trigger rebuild
        if deleted_pdf:
            rebuild_url = os.environ.get("REBUILD_URL", "http://localhost:5000/api/rebuild")
            headers = {"Content-Type": "application/json"}
            try:
                response = requests.post(rebuild_url, json={"group": category}, headers=headers)
                if response.status_code == 200:
                    logger.info(f"Triggered vector rebuild for category: {category}")
                else:
                    logger.error(f"Failed to trigger rebuild: {response.text}")
            except Exception as e:
                logger.warning(f"Gagal trigger rebuild untuk {category}: {e}")

        return jsonify({
            "status": "deleted",
            "deleted_pdf": deleted_pdf,
            "deleted_non_pdf": deleted_non_pdf,
            "deleted_meta_files": deleted_meta_files,
            "deleted_md_folder": deleted_md_folder
        }), 200

    except Exception as e:
        logger.error(f"Gagal hapus file {folder} di kategori {category}:", exc_info=True)
        return jsonify({"error": str(e)}), 500

@crudit_bp.route('/api/link', methods=['POST'])
def upload_link():
    try:
        nama = request.form.get('nama')
        diunggah = datetime.datetime.now(tz).strftime('%d %B %Y %H:%M')
        jenis = request.form.get('jenis')
        deskripsi = request.form.get('deskripsi', '')
        link = request.form.get('link')
        category = request.form.get('category', 'umum')

        if not nama or not jenis or not link:
            return jsonify({"error": "Field nama, jenis, dan link wajib diisi"}), 400

        folder_path = os.path.join(DATA_PATH, "markdown", category)
        os.makedirs(folder_path, exist_ok=True)

        # Simpan nama asli untuk ditampilkan nanti
        original_nama = nama

        # Ganti karakter berbahaya dalam nama file
        safe_nama = nama.replace("/", "_").replace("\\", "_")
        unique_id = uuid.uuid4().hex[:8]
        filename = f"{safe_nama}_{unique_id}.md"
        filepath = os.path.join(folder_path, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"Nama: {original_nama}\n")
            f.write(f"Diunggah: {diunggah}\n")  # tampilkan yang asli di dalam file
            f.write(f"Jenis: {jenis}\n")
            f.write(f"Deskripsi: {deskripsi}\n")
            f.write(f"Link: {link}\n")

        # Trigger rebuild
        try:
            response = requests.post(
                os.environ.get("REBUILD_URL", "http://localhost:5000/api/rebuild"),
                json={"group": category},
                headers=headers
            )
            logger.info(f"Rebuild response: {response.status_code} - {response.text}")
        except Exception as e:
            logger.warning(f"Gagal trigger rebuild link: {e}")

        return jsonify({"message": "Link berhasil disimpan", "filename": filename}), 201

    except FileNotFoundError as e:
        logger.error("Folder tidak ditemukan:", exc_info=True)
        return jsonify({"error": "Folder tidak ditemukan: " + str(e)}), 404
    except PermissionError as e:
        logger.error("Permission error saat menulis file:", exc_info=True)
        return jsonify({"error": "Permission error: " + str(e)}), 403
    except Exception as e:
        logger.error("Error saat upload link:", exc_info=True)
        return jsonify({"error": "Terjadi kesalahan: " + str(e)}), 500
    
@crudit_bp.route('/api/link', methods=['GET'])
def list_links():
    try:
        category = request.args.get('category', 'umum')
        folder_path = os.path.join(DATA_PATH, "markdown", category)

        if not os.path.exists(folder_path):
            logger.warning(f"Folder {folder_path} tidak ditemukan.")
            return jsonify({"links": []}), 200

        results = []
        for filename in os.listdir(folder_path):
            if not filename.endswith('.md'):
                continue

            file_path = os.path.join(folder_path, filename)
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    lines = file.readlines()
                    data = {
                        "nama": "",
                        "diunggah": "",
                        "jenis": "",
                        "deskripsi": "",
                        "link": ""
                    }

                    for line in lines:
                        if line.startswith("Nama:"):
                            data["nama"] = line.replace("Nama:", "").strip()
                        elif line.startswith("Diunggah:"):
                            data["diunggah"] = line.replace("Diunggah:", "").strip()
                        elif line.startswith("Jenis:"):
                            data["jenis"] = line.replace("Jenis:", "").strip()
                        elif line.startswith("Deskripsi:"):
                            data["deskripsi"] = line.replace("Deskripsi:", "").strip()
                        elif line.startswith("Link:"):
                            data["link"] = line.replace("Link:", "").strip()

                    results.append({
                        "filename": filename,
                        **data,
                        "url": f"/static/uploads/markdown/{category}/{filename}"
                    })
            except Exception as e:
                logger.error(f"Gagal membaca file {filename}: {e}", exc_info=True)

        return jsonify({"links": results}), 200

    except Exception as e:
        logger.error("Gagal mengambil daftar link:", exc_info=True)
        return jsonify({"error": "Terjadi kesalahan: " + str(e)}), 500


@crudit_bp.route('/api/link/<filename>', methods=['DELETE'])
def delete_link(filename):
    try:
        category = request.args.get('category', 'umum')
        folder_path = os.path.join(DATA_PATH, "markdown", category)
        full_path = os.path.join(folder_path, filename)

        if not os.path.exists(full_path):
            return jsonify({"error": "File tidak ditemukan"}), 404

        os.remove(full_path)
        logger.info(f"Deleted link markdown: {full_path}")

        try:
            response = requests.post(
                os.environ.get("REBUILD_URL", "http://localhost:5000/api/rebuild"),
                json={"group": category},
                headers=headers
            )
        except Exception as e:
            logger.warning(f"Gagal trigger rebuild setelah hapus link: {e}")

        return jsonify({"message": "Link berhasil dihapus"}), 200
    except FileNotFoundError as e:
        logger.error("File tidak ditemukan:", exc_info=True)
        return jsonify({"error": "File tidak ditemukan: " + str(e)}), 404
    except PermissionError as e:
        logger.error("Permission error saat menghapus file:", exc_info=True)
        return jsonify({"error": "Permission error: " + str(e)}), 403
    except Exception as e:
        logger.error("Gagal hapus link:", exc_info=True)
        return jsonify({"error": "Terjadi kesalahan: " + str(e)}), 500


@crudit_bp.route('/api/health/crudit', methods=['GET'])
def health_check_crudit():
    return jsonify({"status": "ok", "service": "crudit"}), 200
