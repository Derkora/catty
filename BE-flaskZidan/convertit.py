import logging
import os
from flask import request
from PyPDF2 import PdfReader
import queue
import threading
import torch
import requests
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered
from marker.config.parser import ConfigParser
from flask import Blueprint, current_app

logger = logging.getLogger(__name__)
convert_bp = Blueprint('convert', __name__)
task_queue = queue.Queue()
ALLOWED_GROUPS = {'mahasiswa', 'umum'}
REBUILD_URL = os.environ.get("REBUILD_URL", "http://localhost:5000/api/rebuild")

def create_directory(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)
        logger.info(f"Created directory: {directory}")

def get_total_pages(pdf_path):
    try:
        with open(pdf_path, 'rb') as f:
            pdf = PdfReader(f)
            return len(pdf.pages)
    except Exception as e:
        logger.error(f"Error reading PDF: {pdf_path}", exc_info=True)
        raise

def process_pdf(pdf_path, group, model_dict):
    logger.info(f"Processing: {pdf_path} in group {group}")
    pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
    output_dir = os.path.join("markdown", group, pdf_name)
    create_directory(output_dir)

    try:
        total_pages = get_total_pages(pdf_path)
        logger.info(f"Total pages: {total_pages} in {pdf_path}")

        for start_page in range(0, total_pages, 5):
            end_page = min(start_page + 4, total_pages - 1)
            logger.debug(f"Processing pages {start_page}-{end_page}")

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
            
            rendered = converter(pdf_path)
            text, _, _ = text_from_rendered(rendered)
            
            output_filename = f"{pdf_name}_p{start_page}-{end_page}.md"
            output_path = os.path.join(output_dir, output_filename)
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(text)
            
            del rendered, converter
            torch.cuda.empty_cache()

        logger.info(f"Conversion complete. Files saved in: {output_dir}")
    
    except Exception as e:
        logger.error(f"Processing error: {pdf_path}", exc_info=True)
        raise

def process_queue():
    logger.info("Starting processing queue")
    model_dict = create_model_dict()
    while True:
        item = task_queue.get()
        pdf_path, group = item
        try:
            logger.info(f"Processing queue item: {pdf_path}")
            process_pdf(pdf_path, group, model_dict)
        except Exception as e:
            logger.error(f"Queue processing error: {pdf_path}", exc_info=True)
        finally:
            task_queue.task_done()
            if task_queue.empty():
                try:
                    logger.info("All tasks completed. Sending rebuild signal")
                    requests.post(REBUILD_URL)
                except Exception as e:
                    logger.error(f"Rebuild signal failed: {e}", exc_info=True)

@convert_bp.route('/convert', methods=['POST'])
def upload_file():
    try:
        group_mapping = {
            'Dokumen_MataKuliah': 'mahasiswa',
            'Dokumen_Administrasi': 'umum'
        }
        original_dir = 'original'

        nama_dokumen = request.form.get('namaDokumen')
        if not nama_dokumen:
            logger.error("Missing document name")
            return 'Document name required', 400

        file = request.files['file']
        original_filename = f"{nama_dokumen}.pdf"
        original_path = os.path.join(original_dir, original_filename)
        jenis = request.form.get('jenisDokumen')

        if not jenis or jenis not in group_mapping:
            logger.error(f"Invalid document type: {jenis}")
            return 'Invalid document type', 400

        group = group_mapping[jenis]

        if file.filename.lower().endswith('.pdf'):
            create_directory(original_dir)
            file.save(original_path)
            logger.info(f"File saved: {original_path}")
            task_queue.put((original_path, group))
            return '', 204
        
        logger.error("Invalid file format")
        return 'Invalid file', 400

    except Exception as e:
        logger.error("Upload error", exc_info=True)
        return f"Server error: {e}", 500

if __name__ == '__main__':
    create_directory('original')
    create_directory('markdown')
    for group in ALLOWED_GROUPS:
        create_directory(os.path.join("markdown", group))
    worker_thread = threading.Thread(target=process_queue, daemon=True)
    worker_thread.start()
    convert_bp.run(host='0.0.0.0', port=5000)