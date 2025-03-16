from flask import Flask, request, jsonify, render_template
import requests
import os

app = Flask(__name__, template_folder="templates", static_folder="static")

# Pastikan Port URL benar (gunakan nama service "ollama" di Docker)
OLLAMA_URL = os.getenv("OLLAMA_HOST", "http://host.docker.internal:11434") + "/api/generate"
MODEL = os.getenv("MODEL", "deepseek-r1:1.5b")

def load_knowledge():
    """Membaca semua file dalam folder 'knowledge' dan menggabungkan isinya."""
    knowledge = []
    folder = "knowledge"
    if os.path.exists(folder):
        for file_name in os.listdir(folder):
            file_path = os.path.join(folder, file_name)
            if os.path.isfile(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    knowledge.append(f.read().strip())
    return "\n".join(knowledge).strip()

KNOWLEDGE_BASE = load_knowledge()

@app.route("/")
def home():
    """Menampilkan halaman utama."""
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    """Menerima input user dan mengirim permintaan ke Ollama."""
    user_message = request.json.get("message", "").strip()
    if not user_message:
        return jsonify({"reply": "Maaf, pesan tidak boleh kosong."})

    # Buat prompt dengan knowledge base (jika ada)
    if KNOWLEDGE_BASE:
        prompt = f"{KNOWLEDGE_BASE}\n\nUser: {user_message}\nAI:"
    else:
        prompt = f"User: {user_message}\nAI:"

    try:
        response = requests.post(
            OLLAMA_URL, json={"model": MODEL, "prompt": prompt, "stream": False}, timeout=10
        )
        response.raise_for_status()
        
        # Debugging jika terjadi error
        try:
            response_data = response.json()
            ai_reply = response_data.get("response", "Maaf, saya tidak mengerti.")
        except ValueError:
            print("Invalid JSON received:", response.text)
            ai_reply = "Maaf, terjadi kesalahan dalam memproses jawaban AI."

    except requests.exceptions.Timeout:
        ai_reply = "Maaf, server AI sedang sibuk. Silakan coba lagi nanti."
    except requests.exceptions.RequestException as e:
        ai_reply = f"Terjadi kesalahan saat menghubungi AI: {str(e)}"

    return jsonify({"reply": ai_reply})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
