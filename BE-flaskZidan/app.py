import os
import threading
from waitress import serve
from flask import Flask, send_from_directory

# Main app instance
app = Flask(__name__)

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

# Create directories
create_directory('original')
create_directory('markdown')
for group in ALLOWED_GROUPS:
    create_directory(os.path.join("markdown", group))

# Initialize AI components
initialize_embedding_model()
initialize_rag_system()

# Start processing thread
worker_thread = threading.Thread(target=process_queue, daemon=True)
worker_thread.start()

print("App sucessfully deployed!")

@app.route('/')
def serve_index():
    return send_from_directory('templates', 'index.html')

if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=PORT)