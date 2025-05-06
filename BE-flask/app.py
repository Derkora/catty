from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests
import os
import time
from datetime import datetime

# Lazy loading imports
chatit = None
convertit = None

def lazy_load_chatit():
    global chatit
    if chatit is None:
        from modules import chatit
    return chatit

def lazy_load_convertit():
    global convertit
    if convertit is None:
        from modules import convertit
    return convertit

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Inisialisasi state
app.config["USE_CONVERTIT"] = True
STRAPI_URL = os.getenv("STRAPI_URL", "http://localhost:1337")

def save_chat_history(message, response, role, session_id, response_time):
    try:
        # Convert role to match Strapi enum
        user_type = "mahasiswa" if role == "mahasiswa" else "public"
        
        history_data = {
            "data": {
                "message": message,
                "response": response,
                "userType": user_type,
                "sessionId": session_id,
                "responseTime": response_time,
                "timestamp": datetime.utcnow().isoformat(),
                "publishedAt": datetime.utcnow().isoformat()
            }
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        response = requests.post(f"{STRAPI_URL}/api/histories", json=history_data, headers=headers)
        if response.status_code != 200:
            print(f"Failed to save history: {response.status_code} - {response.text}")
            return False
        return True
    except Exception as e:
        print(f"Error saving history: {e}")
        return False

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/set-mode", methods=["POST"])
def set_mode():
    data = request.json
    use_convertit = data.get("useConvertit", True)
    app.config["USE_CONVERTIT"] = use_convertit
    return jsonify({"status": "success", "useConvertit": use_convertit})

@app.route("/chat", methods=["POST"])
def chat():
    req = request.get_json()
    
    # Tambahkan useConvertit ke payload jika ingin digunakan
    req["useConvertit"] = app.config["USE_CONVERTIT"]
    
    # Lazy load chatit and process the chat request
    chatit_module = lazy_load_chatit()
    start_time = time.time()
    response = chatit_module.handle_chat_request(req)
    end_time = time.time()
    response_time = int((end_time - start_time) * 1000)  # Convert to milliseconds
    
    # Save chat history to Strapi
    save_chat_history(
        message=req.get("message", ""),
        response=response.get("reply", ""),
        role=req.get("role", "general"),
        session_id=req.get("sessionId", "default"),
        response_time=response_time
    )
    
    return response

@app.route("/convert", methods=["POST"])
def handle_convert():
    use_convertit = app.config["USE_CONVERTIT"]

    if not use_convertit:
        return jsonify({"message": "Convertit dimatikan. Upload dibatalkan oleh mode chatbot."})
    
    # Lazy load convertit and process the PDF upload
    convertit_module = lazy_load_convertit()
    return convertit_module.handle_pdf_upload(request)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)