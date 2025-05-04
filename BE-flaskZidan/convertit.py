from flask import Flask, request
import os
from PyPDF2 import PdfReader
import queue
import threading
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered
from marker.config.parser import ConfigParser
import torch
import requests

from flask import Blueprint, request, current_app
# ... keep other imports ...

convert_bp = Blueprint('convert', __name__)

task_queue = queue.Queue()

REBUILD_URL = "http://localhost:5000/api/rebuild"

# Define allowed groups
ALLOWED_GROUPS = {'mahasiswa', 'umum'}

def create_directory(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

def get_total_pages(pdf_path):
    with open(pdf_path, 'rb') as f:
        pdf = PdfReader(f)
        return len(pdf.pages)

def process_pdf(pdf_path, group, model_dict):
    print(f"Processing: {pdf_path} in group {group}")
    pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
    output_dir = os.path.join("markdown", group, pdf_name)
    create_directory(output_dir)
    
    try:
        total_pages = get_total_pages(pdf_path)
        
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
            
            rendered = converter(pdf_path)
            text, _, _ = text_from_rendered(rendered)
            
            output_filename = f"{pdf_name}_p{start_page}-{end_page}.md"
            output_path = os.path.join(output_dir, output_filename)
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(text)
            
            del rendered, converter
            torch.cuda.empty_cache()

        print(f"\nConversion complete. Files saved in: {output_dir}")
    
    except Exception as e:
        print(f"Error: {e}")

def process_queue():
    model_dict = create_model_dict()
    while True:
        item = task_queue.get()
        pdf_path, group = item
        try:
            process_pdf(pdf_path, group, model_dict)
        except Exception as e:
            print(f"Error processing {pdf_path}: {e}")
        finally:
            task_queue.task_done()
            # Check if queue is empty after processing
            if task_queue.empty():
                try:
                    print("All tasks completed. Sending rebuild signal.")
                    requests.post(REBUILD_URL)
                except Exception as e:
                    print(f"Failed to send rebuild signal: {e}")

@convert_bp.route('/convert', methods=['POST'])
def upload_file():
    
    # Map document types to groups
    group_mapping = {
        'Dokumen_MataKuliah': 'mahasiswa',
        'Dokumen_Administrasi': 'umum'
    }

    original_dir = 'original'

    # Add namaDokumen handling
    nama_dokumen = request.form.get('namaDokumen')
    if not nama_dokumen:
        return 'Document name required', 400
        
    # Rename file using namaDokumen
    file = request.files['file']
    original_filename = f"{nama_dokumen}.pdf"  # Preserve PDF extension
    original_path = os.path.join(original_dir, original_filename)
    
    jenis = request.form.get('jenisDokumen')  # Changed from 'group'

    group = group_mapping[jenis]

    if not jenis or jenis not in group_mapping:
        return 'Invalid document type', 400
    
    if file.filename.lower().endswith('.pdf'):
        create_directory(original_dir)
        original_path = os.path.join(original_dir, file.filename)
        file.save(original_path)
        task_queue.put((original_path, group))
        return '', 204
    return 'Invalid file', 400

if __name__ == '__main__':
    create_directory('original')
    create_directory('markdown')
    # Pre-create group directories (optional, handled by process_pdf)
    for group in ALLOWED_GROUPS:
        create_directory(os.path.join("markdown", group))
    worker_thread = threading.Thread(target=process_queue, daemon=True)
    worker_thread.start()
    convert_bp.run(host='0.0.0.0', port=5000)