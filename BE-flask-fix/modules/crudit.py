import os
import shutil
from flask import Blueprint, request, jsonify
import logging
from modules.convertit import process_pdf
from queue import Queue

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

@crudit_bp.route('/api/files', methods=['GET'])
def list_files():
    try:
        category = request.args.get('category', 'mahasiswa')
        original_path = os.path.join("data", "uploads", "original", category)
        markdown_path = os.path.join("data", "uploads", "markdown", category)
        result = []

        if not os.path.exists(original_path):
            logger.warning(f"Original path not found: {original_path}")
            return jsonify({"error": "Category not found"}), 404

        pdfs = [f for f in os.listdir(original_path) if f.endswith('.pdf')]
        mds = []

        if os.path.exists(markdown_path):
            for folder in os.listdir(markdown_path):
                folder_path = os.path.join(markdown_path, folder)
                if os.path.isdir(folder_path):
                    md_files = [f for f in os.listdir(folder_path) if f.endswith('.md')]
                    mds.append({
                        "folder": folder,
                        "files": md_files
                    })

        result.append({
            "pdfs": pdfs,
            "pdf_links": [
                f"/static/uploads/original/{category}/{f}" for f in pdfs
            ],
            "markdown_folders": mds
        })

        return jsonify(result), 200
    except Exception as e:
        logger.error("Error in list_files():", exc_info=True)
        return jsonify({"error": str(e)}), 500


@crudit_bp.route('/api/files/<folder>', methods=['DELETE'])
def delete_file(folder):
    try:
        category = request.args.get('category', 'mahasiswa')
        original_path = os.path.join("data", "uploads", "original", category)
        markdown_folder_path = os.path.join("data", "uploads", "markdown", category, folder)

        # Keamanan: pastikan folder bukan kategori utama
        if folder in ["mahasiswa", "umum"]:
            return jsonify({"error": "Tidak boleh menghapus folder kategori utama!"}), 400

        pdf_file_path = os.path.join(original_path, f"{folder}.pdf")
        pdf_deleted = False
        md_deleted_files = []

        # Hapus PDF
        if os.path.exists(pdf_file_path):
            os.remove(pdf_file_path)
            pdf_deleted = True
            logger.info(f"Deleted PDF file: {pdf_file_path}")

        # Hapus folder markdown
        if os.path.exists(markdown_folder_path):
            if os.path.abspath(markdown_folder_path).startswith(os.path.abspath(os.path.join("data", "uploads", "markdown", category))):
                md_deleted_files = [f for f in os.listdir(markdown_folder_path) if f.endswith('.md')]
                shutil.rmtree(markdown_folder_path)
                logger.info(f"Deleted markdown folder: {markdown_folder_path}")
            else:
                logger.warning(f"Blocked deletion attempt outside allowed path: {markdown_folder_path}")
                return jsonify({"error": "Path tidak valid"}), 400

        # Rebuild vectorstore
        initialize_category_rag(category)

        return jsonify({
            "status": "deleted",
            "deleted_files": {
                "pdf": folder if pdf_deleted else None,
                "mds": md_deleted_files
            }
        }), 200
    except Exception as e:
        logger.error(f"File deletion error in folder {folder} (category: {category}):", exc_info=True)
        return jsonify({"error": str(e)}), 500
