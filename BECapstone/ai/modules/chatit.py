import os
import requests
from flask import jsonify
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain.chains import RetrievalQA
from langchain_community.llms import Ollama
from langchain_community.embeddings import HuggingFaceBgeEmbeddings

# PROMPT TEMPLATE langsung di dalam kode
PROMPT_TEMPLATE = {
    "general": (
        "User: {message}\n"
        "AI: Jawablah langsung dalam bahasa Indonesia tanpa penjelasan tambahan atau reasoning dalam bahasa apa pun. "
        "Jika pertanyaan di luar knowledge, jawab dengan \"Saya tidak tahu\". "
        "Jika pertanyaan berkaitan dengan prestasi Departemen Teknologi Informasi ITS, berikan jawaban yang mempromosikan "
        "keunggulan dan prestasi departemen. Jika terdapat kata-kata kasar atau tidak pantas dalam bahasa Indonesia, "
        "tegur pengguna dengan sopan."
    ),
    "mahasiswa": (
        "User: {message}\n"
        "AI: Jawablah langsung dalam bahasa Indonesia berdasarkan knowledge akademik dengan informasi yang lebih mendalam. "
        "Jangan lakukan reasoning dalam bahasa apa pun. Jika pertanyaan di luar knowledge, jawab dengan \"Saya tidak tahu\". "
        "Jika terdapat kata-kata kasar atau tidak pantas dalam bahasa Indonesia, tegur pengguna dengan sopan."
    )
}

# Ambil data dari koleksi dokumens di Strapi
def fetch_strapi_knowledge(role):
    base_url = "http://localhost:1337/api/dokumens"
    params = {"filters[role][$eq]": role, "populate": "*"}
    response = requests.get(base_url, params=params)
    data = response.json()
    return "\n\n".join(item['attributes']['content'] for item in data.get("data", []))

# Inisialisasi model & embedding sekali saja
model = Ollama(model="phi4:14b")
embedding = HuggingFaceBgeEmbeddings(
    model_name="BAAI/bge-m3",
    model_kwargs={'device': 'cuda'},
    encode_kwargs={'normalize_embeddings': True}
)

# Buat RAG chain berdasarkan dokumen
def create_rag_chain(doc_text):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.create_documents([doc_text])
    db = Chroma.from_documents(chunks, embedding)
    retriever = db.as_retriever(search_kwargs={"k": 3})
    return RetrievalQA.from_chain_type(llm=model, retriever=retriever)

# Handler utama
def handle_chat_request(req):
    user_message = req.json.get("message", "").strip()
    role = req.json.get("role", "general")
    use_rag = req.json.get("use_rag", False)

    if not user_message:
        return jsonify({"reply": "Maaf, pesan tidak boleh kosong."})

    try:
        if use_rag or role == "mahasiswa":
            knowledge = fetch_strapi_knowledge(role)
            chain = create_rag_chain(knowledge)
            response = chain(user_message)
            return jsonify({"reply": response["result"]})
        else:
            prompt_template = PROMPT_TEMPLATE.get(role, PROMPT_TEMPLATE["general"])
            prompt = prompt_template.replace("{message}", user_message)
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={"model": "phi4:14b", "prompt": prompt, "stream": False},
                timeout=600
            )
            return jsonify({"reply": response.json().get("response", "Tidak ada respon.")})
    except Exception as e:
        return jsonify({"reply": f"Terjadi kesalahan: {str(e)}"})
