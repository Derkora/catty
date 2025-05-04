import os
import requests
from flask import jsonify
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# Global setup
STRAPI_URL = os.getenv("STRAPI_URL", "http://host.docker.internal:1337")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://host.docker.internal:11434")

MODEL_NAME = "qwen2.5:7b-instruct"
EMBEDDING_MODEL_NAME = "BAAI/bge-m3"
PERSIST_DIRECTORY = "./chroma_db"

# Globals
embedding = None
retriever = None
model = None
qa_chains = {}  # role-based chain

# Template RAG (dengan context)
PROMPT_TEMPLATE_WITH_CONTEXT = {
    "general": PromptTemplate(
        input_variables=["context", "question"],
        template=(
            "Berikut ini adalah informasi dari dokumen:\n"
            "{context}\n\n"
            "User: {question}\n"
            "AI: Jawablah dalam bahasa Indonesia. "
            "Jika pertanyaan di luar knowledge, jawab dengan \"Saya tidak tahu\". "
            "Jika pertanyaan berkaitan dengan prestasi Departemen Teknologi Informasi ITS, berikan jawaban yang mempromosikan "
            "keunggulan dan prestasi departemen. Jika terdapat kata-kata kasar atau tidak pantas dalam bahasa Indonesia, "
            "tegur pengguna dengan sopan."
        )
    ),
    "mahasiswa": PromptTemplate(
        input_variables=["context", "question"],
        template=(
            "Berikut ini adalah informasi dari dokumen:\n"
            "{context}\n\n"
            "User: {question}\n"
            "AI: Jawablah dalam bahasa Indonesia berdasarkan knowledge akademik dengan informasi yang lebih mendalam. "
            "Jika pertanyaan di luar knowledge, jawab dengan \"Saya tidak tahu\". "
            "Jika terdapat kata-kata kasar atau tidak pantas dalam bahasa Indonesia, tegur pengguna dengan sopan."
        )
    )
}

def fetch_strapi_knowledge():
    try:
        base_url = f"{STRAPI_URL}/api/dokumens"
        print(f"📡 Mengambil dokumen dari {base_url} ...")
        response = requests.get(base_url, params={"populate": "*"}, timeout=10)
        response.raise_for_status()
        data = response.json()

        knowledge = []
        for item in data.get("data", []):
            markdown_info = item.get("markdownFile", {})
            markdown_url = markdown_info.get("url")
            if markdown_url:
                full_url = f"{STRAPI_URL}{markdown_url}"
                try:
                    md_response = requests.get(full_url, timeout=10)
                    md_response.raise_for_status()
                    content = md_response.text.strip()
                    if content:
                        print(f"📄 Berhasil ambil: {markdown_info.get('name')} ({len(content)} char)")
                        knowledge.append(content)
                except Exception as e:
                    print(f"⚠️ Gagal ambil markdown: {e}")
        return "\n\n".join(knowledge)
    except Exception as e:
        print(f"❌ Gagal ambil data dari Strapi: {e}")
        return ""

def init_embedding():
    from langchain_community.embeddings import HuggingFaceBgeEmbeddings
    print("🔁 Memuat embedding HuggingFace...")
    return HuggingFaceBgeEmbeddings(
        model_name=EMBEDDING_MODEL_NAME,
        model_kwargs={'device': 'cuda'},
        encode_kwargs={'normalize_embeddings': True}
    )


def init_model():
    from langchain_community.llms import Ollama
    print("🔁 Memuat model LLM Ollama...")
    return Ollama(model=MODEL_NAME, base_url=OLLAMA_HOST)


def init_retriever(knowledge_text):
    global embedding
    embedding = init_embedding()

    if os.path.exists(PERSIST_DIRECTORY) and os.listdir(PERSIST_DIRECTORY):
        print("📂 Memuat vectorstore dari disk (Chroma)...")
        db = Chroma(
            persist_directory=PERSIST_DIRECTORY,
            embedding_function=embedding
        )
    else:
        print("🧱 Membuat vectorstore baru dan menyimpannya ke disk (Chroma)...")
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = splitter.create_documents([knowledge_text])
        db = Chroma.from_documents(
            chunks,
            embedding,
            persist_directory=PERSIST_DIRECTORY
        )
        db.persist()
        print("💾 Vectorstore berhasil disimpan.")

    return db.as_retriever(search_kwargs={"k": 3})


def init_qa_chain_with_context(role):
    global model
    if model is None:
        model = init_model()
    return RetrievalQA.from_chain_type(
        llm=model,
        retriever=retriever,
        chain_type="stuff",
        chain_type_kwargs={"prompt": PROMPT_TEMPLATE_WITH_CONTEXT[role]}
    )


def lazy_initialize_if_needed():
    global knowledge_text, retriever, qa_chains
    if not retriever:
        print("🚀 Lazy init: memuat knowledge base...")
        knowledge_text = fetch_strapi_knowledge()
        if knowledge_text.strip():
            retriever = init_retriever(knowledge_text)
            for role in PROMPT_TEMPLATE_WITH_CONTEXT:
                qa_chains[role] = init_qa_chain_with_context(role)
            print("✅ Lazy init berhasil!")
        else:
            print("⚠️ Tidak ada knowledge yang dimuat dari Strapi")


def handle_chat_request(req):
    user_message = req.get("message", "").strip()
    role = req.get("role", "")

    print(f"📥 Role: {role} (mode RAG)")
    if not user_message:
        return jsonify({"reply": "Maaf, pesan tidak boleh kosong."})

    try:
        lazy_initialize_if_needed()
        if not retriever or role not in qa_chains:
            return jsonify({"reply": "Knowledge belum tersedia. Silakan coba lagi nanti."})
        response = qa_chains[role]({"query": user_message})
        return jsonify({"reply": response["result"]})
    except Exception as e:
        return jsonify({"reply": f"Terjadi kesalahan: {str(e)}"})