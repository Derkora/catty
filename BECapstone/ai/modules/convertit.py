import os
from werkzeug.utils import secure_filename
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered
from marker.config.parser import ConfigParser
import requests

# Konfigurasi
UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

converter = PdfConverter(
    artifact_dict=create_model_dict(),
    config=ConfigParser({
        "output_format": "markdown",
        "disable_image_extraction": "true",
        "use_llm": "true",
        "llm_service": "marker.services.ollama.OllamaService",
        "ollama_model": "phi4:14b",
        "ollama_base_url": "http://localhost:11434",
        "output_dir": "./"
    }).generate_config_dict()
)

def upload_to_strapi(title, content_md):
    response = requests.post("http://localhost:1337/api/dokumens", json={
        "data": {"title": title, "content": content_md, "role": "mahasiswa"}
    })
    return response.ok

def delete_from_strapi(title):
    response = requests.get("http://localhost:1337/api/dokumens", params={
        "filters[title][$eq]": title
    })
    data = response.json().get("data", [])
    if data:
        doc_id = data[0]["id"]
        delete_resp = requests.delete(f"http://localhost:1337/api/dokumens/{doc_id}")
        return delete_resp.ok
    return False

def handle_pdf_upload(req):
    if "file" not in req.files:
        return {"message": "No file part"}, 400
    file = req.files["file"]
    if file.filename == "":
        return {"message": "No selected file"}, 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_DIR, filename)
    file.save(save_path)

    rendered = converter(save_path)
    text, _ = text_from_rendered(rendered)

    title = os.path.splitext(filename)[0]
    upload_success = upload_to_strapi(title, text)

    return {"message": "Success" if upload_success else "Upload to Strapi failed"}

def handle_file_deletion(req):
    filename = req.json.get("filename")
    if not filename:
        return {"message": "No filename provided"}, 400

    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    title = os.path.splitext(filename)[0]
    deleted = delete_from_strapi(title)

    return {"message": "Deleted" if deleted else "Failed to delete in Strapi"}
