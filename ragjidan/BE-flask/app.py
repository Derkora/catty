from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

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
CORS(app)

# Inisialisasi state
app.config["USE_CONVERTIT"] = True

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
    return chatit_module.handle_chat_request(req)

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
