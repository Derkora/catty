from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from modules import chatit, convertit

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST", "OPTIONS"])
def handle_chat():
    if request.method == "OPTIONS":
        return "", 200
    return chatit.handle_chat_request(request)

"""
@app.route("/convert", methods=["POST"])
def handle_convert():
    return convertit.handle_pdf_upload(request)

@app.route("/delete-file", methods=["POST"])
def handle_file_deletion():
    return convertit.handle_file_deletion(request)
"""

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
