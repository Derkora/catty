import os
import sys
import threading
import logging
from utils.ecrypit import encrypt_uuid, decrypt_uuid
import glob
# requests and datetime removed as they are now in history_utils.py
from waitress import serve
from flask import Flask, send_from_directory, request, jsonify, render_template
from flask_cors import CORS

# Setup path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Flask app setup
app = Flask(__name__)
CORS(app)

# Environment config
PORT = int(os.environ.get("PORT", 5000))
REBUILD_URL = f"http://localhost:{PORT}/api/rebuild"
os.environ["REBUILD_URL"] = REBUILD_URL

# === Import blueprints & helper functions ===
from modules.chatit import chat_bp
from modules.convertit import convert_bp, create_directory, ALLOWED_GROUPS, process_queue
from modules.crudit import crudit_bp
from modules.history_utils import history_bp

# save_chat_history function and STRAPI_URL removed, now in modules/history_utils.py

# Register blueprints
app.register_blueprint(chat_bp)
app.register_blueprint(convert_bp)
app.register_blueprint(crudit_bp)
app.register_blueprint(history_bp)

# === Request Logging ===
@app.before_request
def log_request():
    try:
        logger.info(f"Request: {request.method} {request.path}")
        if request.content_type == 'application/json':
            logger.info(f"Request JSON: {request.get_json(silent=True)}")
        elif request.content_type and 'form-data' in request.content_type:
            logger.info(f"Form data: {request.form.to_dict()}")
    except Exception as e:
        logger.error(f"Error in before_request logging: {e}", exc_info=True)

@app.after_request
def log_response(response):
    try:
        logger.info(f"Response: {response.status}")
        if response.content_type == 'application/json':
            logger.info(f"Response JSON: {response.get_json()}")
    except Exception as e:
        logger.error(f"Error in after_request logging: {e}", exc_info=True)
    return response

# === Directory setup ===
UPLOAD_BASE = os.path.join('data', 'uploads')
create_directory(os.path.join(UPLOAD_BASE, 'original'))
create_directory(os.path.join(UPLOAD_BASE, 'markdown'))
for group in ALLOWED_GROUPS:
    create_directory(os.path.join(UPLOAD_BASE, 'original', group))
    create_directory(os.path.join(UPLOAD_BASE, 'markdown', group))

VECTORSTORE_BASE = os.path.join('data', 'vectorstores')
create_directory(os.path.join(VECTORSTORE_BASE, 'umum'))
create_directory(os.path.join(VECTORSTORE_BASE, 'mahasiswa'))

# === Worker Thread ===
try:
    worker_thread = threading.Thread(target=process_queue, daemon=True)
    worker_thread.start()
    logger.info("Background worker thread started.")
except Exception as e:
    logger.error(f"Failed to start worker thread: {e}", exc_info=True)

# === Route for index.html ===
@app.route('/')
def serve_index():
    try:
        return send_from_directory('templates', 'index.html')
    except Exception as e:
        logger.error("Error serving index.html", exc_info=True)
        return jsonify({"error": "Index not found"}), 500
    
@app.route('/get-file/<token>')
def get_file_by_token(token):
    try:
        uuid = decrypt_uuid(token)
        logger.info(f"Decrypted UUID: {uuid}")

        # Telusuri semua kategori
        for category in ALLOWED_GROUPS:
            folder = os.path.join("data", "uploads", "original", category)
            matching_files = glob.glob(os.path.join(folder, f"*_{uuid}.*"))
            
            if matching_files:
                filename = os.path.basename(matching_files[0])
                logger.info(f"Serving file {filename} from {category}")
                return send_from_directory(folder, filename)

        logger.warning(f"No file found for UUID: {uuid}")
        return jsonify({"error": "File not found"}), 404
    except Exception as e:
        logger.error(f"Error in get_file_by_token: {e}", exc_info=True)
        return jsonify({"error": "Invalid token"}), 400

@app.route("/api/encrypt", methods=["POST"])
def encrypt_uuid_api():
    try:
        data = request.get_json()
        uuid = data.get("uuid")
        if not uuid:
            return jsonify({"error": "UUID tidak diberikan"}), 400
        token = encrypt_uuid(uuid)
        return jsonify({"token": token})
    except Exception as e:
        logger.error(f"Error encrypting UUID: {e}", exc_info=True)
        return jsonify({"error": "Gagal enkripsi UUID"}), 500

# === Blok proteksi akses langsung ke API ===
API_PROTECTED_ROUTES = [
    '/api/encrypt',
    '/api/chat',
    '/api/rebuild',
    '/api/history',
    '/get-file',
]

@app.before_request
def block_direct_web_access():
    if request.path.startswith('/api/') or request.path.startswith('/get-file'):
        if request.method == 'GET':
            return
        if request.is_json or request.headers.get('X-Requested-With', '').lower() == 'xmlhttprequest':
            return
        if request.content_type and request.content_type.startswith("multipart/form-data"):
            return
        if request.method == 'DELETE' and request.headers.get('X-Requested-With', '').lower() == 'xmlhttprequest':
            return
        logger.warning(f"Blocked direct access to API route: {request.path}")
        return jsonify({'error': 'Not Found'}), 404


@app.errorhandler(404)
def handle_404(e):
    logger.warning(f"404 Not Found: {request.path}")
    if request.accept_mimetypes.best == 'application/json':
        return jsonify({'error': 'Not Found'}), 404
    return render_template("404.html"), 404

@app.route("/health")
def health_check():
    return jsonify({"status": "ok"}), 200

# === Entrypoint ===
if __name__ == '__main__':
    try:
        logger.info(f"Starting server on port {PORT}")
        serve(app, host='0.0.0.0', port=PORT, ident=None)
    except Exception as e:
        logger.critical(f"Fatal error while starting server: {e}", exc_info=True)
