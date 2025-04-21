from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import requests

# LangChain + RAG dependencies
from langchain_community.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain.chains import RetrievalQA
from langchain_community.llms import Ollama
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
import shutil

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

# Konfigurasi Ollama API (untuk prompt biasa)
OLLAMA_URL = os.getenv("OLLAMA_HOST", "http://localhost:11434") + "/api/generate"
MODEL = os.getenv("MODEL", "deepseek-r1:32b")

# === Knowledge Loading untuk prompt biasa ===
def load_prompt(role):
    path = os.path.join("behaviour", f"{role}.md")
    default_path = os.path.join("behaviour", "general.md")
    file_path = path if os.path.exists(path) else default_path
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read().strip()

def load_knowledge():
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

def generate_prompt(role, user_message):
    prompt_template = load_prompt(role)
    if role == "mahasigma":
        knowledge_section = KNOWLEDGE_BASE["general"] + "\n\n" + KNOWLEDGE_BASE["mahasigma"]
    else:
        knowledge_section = KNOWLEDGE_BASE["general"]
    return f"{knowledge_section}\n\n" + prompt_template.replace("{message}", user_message)

# === RAG Inisialisasi ===
DATA_PATH = "/app/rag/Data"
CHROMA_PATH = "/app/rag/chroma"

model_name = "BAAI/bge-m3"
encode_kwargs = {'normalize_embeddings': True}
model_norm = HuggingFaceBgeEmbeddings(
    model_name=model_name,
    model_kwargs={'device': 'cuda'},
    encode_kwargs=encode_kwargs
)
llm_rag = Ollama(model="deepseek-r1:32b")

vectordb = None
qa_chain = None

def initialize_rag():
    global vectordb, qa_chain
    if os.path.exists(CHROMA_PATH):
        vectordb = Chroma(persist_directory=CHROMA_PATH, embedding_function=model_norm)
    else:
        loader = DirectoryLoader(DATA_PATH, glob="*.md")
        documents = loader.load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = splitter.split_documents(documents)
        if os.path.exists(CHROMA_PATH):
            shutil.rmtree(CHROMA_PATH)
        vectordb = Chroma.from_documents(chunks, model_norm, persist_directory=CHROMA_PATH)

    retriever = vectordb.as_retriever(search_kwargs={"k": 3})
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm_rag,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=False
    )

# Jalankan saat server start
print("🔄 Menginisialisasi sistem RAG...")
initialize_rag()
print("✅ Sistem RAG siap digunakan.")

# === ROUTES ===
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():
    if request.method == "OPTIONS":
        return "", 200

    user_message = request.json.get("message", "").strip()
    role = request.json.get("role", "general")
    use_rag = request.json.get("use_rag", False)

    if not user_message:
        return jsonify({"reply": "Maaf, pesan tidak boleh kosong."})

    try:
        if role == "mahasigma" or use_rag:
            # Gunakan RAG pipeline
            response_data = qa_chain(user_message)
            ai_reply = response_data['result']
        else:
            # Gunakan prompt biasa
            prompt = generate_prompt(role, user_message)
            response = requests.post(
                OLLAMA_URL,
                json={"model": MODEL, "prompt": prompt, "stream": False},
                timeout=600
            )
            response.raise_for_status()
            response_data = response.json()
            ai_reply = response_data.get("response", "Maaf, saya tidak mengerti.")
    except requests.exceptions.Timeout:
        ai_reply = "Maaf, server AI sedang sibuk. Silakan coba lagi nanti."
    except Exception as e:
        ai_reply = f"Terjadi kesalahan: {str(e)}"

    return jsonify({"reply": ai_reply})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


'''
from flask import Flask, request, jsonify, render_template
import requests
import os
from flask_cors import CORS

app = Flask(__name__, template_folder="templates", static_folder="static")
# Simple CORS configuration allowing all origins
CORS(app)

# Konfigurasi Ollama API
OLLAMA_URL = os.getenv("OLLAMA_HOST", "http://ollama:11434") + "/api/generate"
MODEL = os.getenv("MODEL", "deepseek-r1:7b")


def load_prompt(role):
    """Memuat template prompt dari file Markdown sesuai dengan role."""
    path = os.path.join("behaviour", f"{role}.md")
    default_path = os.path.join("behaviour", "general.md")
    
    if os.path.exists(path):
        file_path = path
    else:
        file_path = default_path
    
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read().strip()


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

def generate_prompt(role, user_message):
    """Menghasilkan prompt sesuai dengan role pengguna."""
    prompt_template = load_prompt(role)

    # Jika role adalah "mahasigma", gabungkan knowledge "general" + "mahasigma"
    if role == "mahasigma":
        knowledge_section = KNOWLEDGE_BASE["general"] + "\n\n" + KNOWLEDGE_BASE["mahasigma"]
    else:
        knowledge_section = KNOWLEDGE_BASE["general"]

    return f"{knowledge_section}\n\n" + prompt_template.replace("{message}", user_message)

# ending 1
@app.route("/")
def home():
    """Menampilkan halaman utama."""
    return render_template("index.html")

# ending 2
"""
@app.route("/")
def home():
    return "Halaman ini tidak tersedia."
"""

@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():
    """Menerima input user dan mengirim permintaan ke Ollama."""
    # Handle OPTIONS request for CORS preflight
    if request.method == "OPTIONS":
        return "", 200
        
    user_message = request.json.get("message", "").strip()
    role = request.json.get("role", "general")  

    if not user_message:
        return jsonify({"reply": "Maaf, pesan tidak boleh kosong."})

    # Generate prompt berdasarkan role
    prompt = generate_prompt(role, user_message)
    if prompt is None:
        return jsonify({"reply": "Pesan tidak diperbolehkan."})

    try:
        response = requests.post(
            OLLAMA_URL, json={"model": MODEL, "prompt": prompt, "stream": False}, timeout=100 # timeout 100 detik
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
'''
