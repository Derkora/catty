import os
import threading
import logging
from waitress import serve
from flask import Flask, send_from_directory, request
from flask_cors import CORS

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Main app instance
app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Configuration
PORT = int(os.environ.get("PORT", 5000))
REBUILD_URL = f"http://localhost:{PORT}/api/rebuild"
os.environ["REBUILD_URL"] = REBUILD_URL

# Import blueprints after configuration
from chatit import chat_bp
from convertit import convert_bp

# Register blueprints at root level
app.register_blueprint(chat_bp)
app.register_blueprint(convert_bp)

# Initialize components
from convertit import create_directory, ALLOWED_GROUPS, process_queue
from chatit import initialize_embedding_model, initialize_rag_system

@app.before_request
def log_request():
    logger.info(f"Request: {request.method} {request.path}")
    if request.content_type == 'application/json':
        logger.info(f"Request JSON: {request.get_json(silent=True)}")
    elif request.content_type and 'form-data' in request.content_type:
        logger.info(f"Form data: {request.form.to_dict()}")

@app.after_request
def log_response(response):
    logger.info(f"Response: {response.status}")
    if response.content_type == 'application/json':
        logger.info(f"Response JSON: {response.get_json()}")
    return response

# Create directories
create_directory('original')
create_directory('markdown')
for group in ALLOWED_GROUPS:
    create_directory(os.path.join("markdown", group))

# Initialize AI components
try:
    initialize_embedding_model()
    initialize_rag_system()
except Exception as e:
    logger.error(f"Initialization failed: {e}", exc_info=True)
    raise

# Start processing thread
worker_thread = threading.Thread(target=process_queue, daemon=True)
worker_thread.start()

logger.info("App successfully deployed!")

@app.route('/')
def serve_index():
    return send_from_directory('templates', 'index.html')

if __name__ == '__main__':
    logger.info(f"Starting server on port {PORT}")
    serve(app, host='0.0.0.0', port=PORT, ident=None)
