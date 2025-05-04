import os
import threading
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from waitress import serve
from flask import send_from_directory


# Import both Flask apps
from chatit import app as chat_app, initialize_embedding_model, initialize_rag_system
from convertit import (
    app as convert_app,
    create_directory,
    ALLOWED_GROUPS,
    process_queue,
    REBUILD_URL
)

# Initialize chat components
initialize_embedding_model()
initialize_rag_system()

# Update convert's rebuild URL to point to the combined app
port = int(os.environ.get("PORT", 5000))
convert_port = os.environ.get("CONVERT_PORT", str(port))
REBUILD_URL = f"http://localhost:{port}/api/rebuild"

# Initialize convert components
create_directory('original')
create_directory('markdown')
for group in ALLOWED_GROUPS:
    create_directory(os.path.join("markdown", group))

# Start processing thread
worker_thread = threading.Thread(target=process_queue, daemon=True)
worker_thread.start()

# Combine applications with middleware
application = DispatcherMiddleware(chat_app, {
    '/chat': chat_app,  # Map chat endpoints directly
    '/convert': convert_app
})

@app.route('/')
def serve_index():
    return send_from_directory('templates', 'index.html')

if __name__ == '__main__':
    serve(application, host='0.0.0.0', port=port)