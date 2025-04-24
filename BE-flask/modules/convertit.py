import os
import json
import requests
from flask import jsonify
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import logging

from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered
from marker.config.parser import ConfigParser

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

STRAPI_URL = os.getenv("STRAPI_URL", "http://host.docker.internal:1337")
UPLOAD_DIR = "./uploads"
MD_TEMP_DIR = "./mdtmp"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(MD_TEMP_DIR, exist_ok=True)

config_parser = ConfigParser({
    "output_format": "markdown",
    "disable_image_extraction": "true",
    "use_llm": "true",
    "llm_service": "marker.services.ollama.OllamaService",
    "ollama_model": "deepseek-r1:1.5b",
    "ollama_base_url": "http://host.docker.internal:11434",
    "gemini_api_key": "dummy-ignored-key",
    "output_dir": MD_TEMP_DIR
})

converter = PdfConverter(
    artifact_dict=create_model_dict(),
    config=config_parser.generate_config_dict(),
    processor_list=config_parser.get_processors(),
    renderer=config_parser.get_renderer(),
    llm_service=config_parser.get_llm_service()
)

def delete_from_strapi(title):
    response = requests.get(
        f"{STRAPI_URL}/api/dokumens",
        params={"filters[namaDokumen][$eq]": title}
    )
    data = response.json().get("data", [])
    if data:
        doc_id = data[0]["id"]
        delete_resp = requests.delete(f"{STRAPI_URL}/api/dokumens/{doc_id}")
        return delete_resp.ok
    return False

def handle_pdf_upload(request):
    file = request.files.get("file")
    jenis_dokumen = request.form.get("jenisDokumen")
    nama_dokumen = request.form.get("namaDokumen")

    if not file or not nama_dokumen:
        return jsonify({"message": "File atau nama dokumen tidak ditemukan."}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_DIR, filename)
    file.save(filepath)

    try:
        rendered = converter(filepath)
        text, *_ = text_from_rendered(rendered)
        logger.debug(f"Markdown output (preview): {text[:200]}...")
    except Exception as e:
        logger.exception("Gagal melakukan konversi PDF ke Markdown")
        return jsonify({"message": "Gagal mengonversi PDF ke Markdown", "error": str(e)}), 500

    markdown_filename = os.path.splitext(filename)[0] + ".md"
    markdown_path = os.path.join(MD_TEMP_DIR, markdown_filename)

    try:
        with open(markdown_path, "w", encoding="utf-8") as md_file:
            md_file.write(text)
    except Exception as e:
        logger.exception("Gagal menyimpan file Markdown")
        return jsonify({"message": "Gagal menyimpan Markdown hasil konversi", "error": str(e)}), 500

    try:
        # Step 1: Upload PDF
        with open(filepath, "rb") as pdf_file:
            upload_pdf_resp = requests.post(
                f"{STRAPI_URL}/api/upload",
                files={"files": (filename, pdf_file, "application/pdf")},
                timeout=30
            )
            upload_pdf_resp.raise_for_status()
            pdf_file_id = upload_pdf_resp.json()[0]["id"]

        # Step 2: Buat entri dokumen awal
        payload = {
            "namaDokumen": nama_dokumen,
            "jenisDokumen": jenis_dokumen,
            "fileDokumen": [pdf_file_id]
        }

        create_doc_resp = requests.post(
            f"{STRAPI_URL}/api/dokumens",
            headers={"Content-Type": "application/json"},
            data=json.dumps({"data": payload}),
            timeout=30
        )
        create_doc_resp.raise_for_status()
        created_doc = create_doc_resp.json()["data"]
        doc_id = created_doc["id"]

        # Step 3: Upload Markdown ke custom route
        with open(markdown_path, "rb") as md_file:
            upload_md_resp = requests.post(
                f"{STRAPI_URL}/api/dokumens/{doc_id}/upload-markdown",
                files={"file": ("converted.md", md_file, "text/markdown")},
                timeout=30
            )
            upload_md_resp.raise_for_status()
            
            # Return respons sukses setelah semua proses berhasil
            return jsonify({
                "message": "Konversi dan unggahan berhasil",
                "dokumenId": doc_id,
                "namaDokumen": nama_dokumen
            }), 200

    except requests.exceptions.Timeout:
        logger.exception("Timeout saat mencoba mengunggah ke Strapi.")
        return jsonify({"message": "Timeout mengunggah ke Strapi"}), 504
    except Exception as e:
        logger.exception("Gagal mengunggah ke Strapi.")
        return jsonify({"message": "Gagal mengunggah ke Strapi", "error": str(e)}), 500
