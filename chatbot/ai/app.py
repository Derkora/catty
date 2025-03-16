from flask import Flask, request, jsonify, render_template
import requests
import os
import json

app = Flask(__name__, template_folder="templates", static_folder="static")

# Konfigurasi Ollama API
OLLAMA_URL = os.getenv("OLLAMA_HOST", "http://localhost:11434") + "/api/generate"
MODEL = os.getenv("MODEL", "deepseek-r1:1.5b")

def load_json(filename):
    """Memuat JSON dari folder behaviour."""
    path = os.path.join("behaviour", filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

# Memuat prompt dan daftar kata kasar dari JSON
PROMPT_TEMPLATES = load_json("prompts.json")
BAD_WORDS = set(load_json("bad_words.json").get("bad_words", []))

def load_knowledge():
    """Membaca semua file dalam folder 'knowledge' dan menggabungkan isinya."""
    knowledge = {"general": "", "mahasigma": ""}
    base_folder = "knowledge"

    for category in knowledge.keys():
        folder_path = os.path.join(base_folder, category)
        if os.path.exists(folder_path):
            for file_name in os.listdir(folder_path):
                file_path = os.path.join(folder_path, file_name)
                if os.path.isfile(file_path):
                    with open(file_path, "r", encoding="utf-8") as f:
                        knowledge[category] += f.read().strip() + "\n"
    
    return knowledge

KNOWLEDGE_BASE = load_knowledge()

def filter_bad_words(text):
    """Mencegah kata-kata kasar dalam input pengguna."""
    words = text.lower().split()
    for word in words:
        if word in BAD_WORDS:
            return True
    return False

def generate_prompt(role, user_message):
    """Menghasilkan prompt sesuai dengan role pengguna."""
    if filter_bad_words(user_message):
        return None  # Jika ada kata kasar, return None
    
    prompt_template = PROMPT_TEMPLATES.get(role, PROMPT_TEMPLATES["general"])
    knowledge_section = KNOWLEDGE_BASE.get(role, "")

    return f"{knowledge_section}\n\n" + prompt_template.replace("{message}", user_message)

@app.route("/")
def home():
    """Menampilkan halaman utama."""
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    """Menerima input user dan mengirim permintaan ke Ollama."""
    user_message = request.json.get("message", "").strip()
    role = request.json.get("role", "general")  

    if not user_message:
        return jsonify({"reply": "Maaf, pesan tidak boleh kosong."})

    # Cek apakah ada kata kasar
    if filter_bad_words(user_message):
        return jsonify({"reply": "Maaf, pesan Anda mengandung kata-kata yang tidak diperbolehkan."})

    # Generate prompt berdasarkan role
    prompt = generate_prompt(role, user_message)
    if prompt is None:
        return jsonify({"reply": "Pesan tidak diperbolehkan."})

    try:
        response = requests.post(
            OLLAMA_URL, json={"model": MODEL, "prompt": prompt, "stream": False}, timeout=10
        )
        response.raise_for_status()

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
