import os
import sys
import threading
import logging
from waitress import serve
from flask import Flask, send_from_directory, request, jsonify
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

# Register blueprints
app.register_blueprint(chat_bp)
app.register_blueprint(convert_bp)
app.register_blueprint(crudit_bp)

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

# === Route for serving PDFs ===
@app.route('/static/uploads/original/<category>/<filename>')
def serve_pdf(category, filename):
    try:
        path = os.path.join("data", "uploads", "original", category)
        return send_from_directory(path, filename)
    except Exception as e:
        logger.error(f"Error serving PDF file {filename} in {category}", exc_info=True)
        return jsonify({"error": "File not found"}), 404

# === Entrypoint ===
if __name__ == '__main__':
    try:
        logger.info(f"Starting server on port {PORT}")
        serve(app, host='0.0.0.0', port=PORT, ident=None)
    except Exception as e:
        logger.critical(f"Fatal error while starting server: {e}", exc_info=True)
