import os
import shutil
import logging
import time # Added for response time calculation
from flask import Blueprint, request, jsonify
from threading import Lock 
from langchain.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import MarkdownHeaderTextSplitter
from langchain.document_loaders import DirectoryLoader, TextLoader
from langchain.schema import Document
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain_community.llms import Ollama
import torch

import chromadb

chat_bp = Blueprint('chat', __name__)
logger = logging.getLogger(__name__)

UPLOADS_MARKDOWN = "data/uploads/markdown"
VECTOR_DIR = "data/vectorstores"

# Initialize heavy resources once
embed = HuggingFaceEmbeddings()
llm = Ollama(model="qwen2.5:7b-instruct", base_url="http://host.docker.internal:11434")
# llm = Ollama(model="qwen2.5:7b-instruct", base_url="http://localhost:11434", temperature=0.8, top_p=0.7)

# Global vectorstore cache with thread lock
vectorstore_cache = {
    'mahasiswa': None,
    'umum': None
}
vectorstore_lock = Lock()

'''
Modifikasi prompt banyak -Zidan
'''
PROMPT_TEMPLATE_WITH_CONTEXT = {
    "general": PromptTemplate(
        input_variables=["context", "question"],
        template=(
            "Kamu adalah Catty, Chatbot IT - asisten AI Departemen Teknologi Informasi ITS.\n"
            "Tugas kamu adalah membantu User menjawab pertanyaan mereka bedasarkan context yang diberikan"
            "User kamu adalah siswa SMA yang membutuhkan informasi lebih dalam sesuai dengan context."
            "Berikut ini adalah informasi dari materi kuliah dan dokumen pendukung:\n"
            "{context}\n\n"
            "User: {question}\n"
            "Setiap jawaban di jawab dengan struktur yang baik, informatif, dan detail namun tetap natural dan menarik untuk dibaca."
            "Jika ada bahasa yang tidak pantas, berikan teguran secara sopan."
            "Selalu respon dengan positif dan menawarkan bantuan untuk User dalam menjawab pertanyaan User terkait Teknologi Informasi."
            "Format jawaban HARUS dalam markdown yang terstruktur dan rapi tanpa blok kode"
        )
    ),
    "mahasiswa": PromptTemplate(
        input_variables=["context", "question"],
        template=(
            "Kamu adalah Catty, Chatbot IT - asisten AI Departemen Teknologi Informasi ITS.\n"
            "Tugas kamu adalah membantu User menjawab pertanyaan mereka bedasarkan context yang diberikan"
            "User kamu adalah mahasiswa teknologi informasi yang membutuhkan informasi lebih dalam sesuai dengan context."
            "Berikut ini adalah informasi dari materi kuliah dan dokumen pendukung:\n"
            "{context}\n\n"
            "User: {question}\n"
            "Setiap jawaban di jawab dengan struktur yang baik, informatif, dan detail namun tetap natural dan menarik untuk dibaca."
            "Jika ada bahasa yang tidak pantas, berikan teguran secara sopan."
            "Selalu respon dengan positif dan menawarkan bantuan untuk User dalam menjawab pertanyaan User terkait Teknologi Informasi."
            "Format jawaban HARUS dalam markdown yang terstruktur dan rapi tanpa blok kode"
        )
    )
}


'''
Di sini juga da perubahan
1. Menghapus pembuatan db gabungan. Aku rasa itu nggak perlu.
2. Karena source document itu perlu db yang specific, maka document2nya akan di simpen di masing-masing db. Kalau sebelumnya semuanya disimpan di combined directory.

-Zidan
'''
def rebuild_chroma(group=None):

    chromadb.api.client.SharedSystemClient.clear_system_cache()

    try:
        with vectorstore_lock:
            # Invalidate cache for rebuilt groups
            if group:
                vectorstore_cache[group] = None
            else:
                vectorstore_cache.update({'mahasiswa': None, 'umum': None})

            for group_name in ['mahasiswa', 'umum']:
                if group and group != group_name:
                    continue  # Skip non-target groups

                # Remove existing group directory
                group_vector_dir = os.path.join(VECTOR_DIR, group_name)
                if os.path.exists(group_vector_dir):
                    shutil.rmtree(group_vector_dir)

                # Load and process group-specific documents
                dir_path = os.path.join(UPLOADS_MARKDOWN, group_name)
                if not os.path.exists(dir_path):
                    logger.warning(f"Markdown folder not found: {group_name}")
                    continue

                loader = DirectoryLoader(dir_path, glob="**/*.md", loader_cls=TextLoader)
                splitter = MarkdownHeaderTextSplitter(headers_to_split_on=[("#", "judul"), ("##", "subjudul")])
                docs = []
                for doc in loader.load():
                    split_docs = splitter.split_text(doc.page_content)
                    for d in split_docs:
                        metadata = {
                            "filename": os.path.basename(doc.metadata['source']),
                            "group": group_name
                        }
                        docs.append(Document(page_content=d.page_content, metadata=metadata))

                # Save to group-specific vector store
                if docs:
                    embed = HuggingFaceEmbeddings()
                    Chroma.from_documents(
                        docs, 
                        embed, 
                        persist_directory=group_vector_dir  # Save to group directory
                    )
                    logger.info(f"Vectorstore rebuilt for {group_name}")

    except Exception as e:
        logger.error("Rebuild error", exc_info=True)
        raise e
    
def natural_join(items: list[str], lang: str) -> str:
    """Join items with proper grammar for English/Indonesian"""
    if not items:
        return ""
    
    # Remove any empty strings
    items = [item for item in items if item]
    
    if len(items) == 1:
        return items[0]
    
    conjunction = " dan " if lang == "id" else " and "
    
    if len(items) == 2:
        return f"{items[0]}{conjunction}{items[1]}"
    
    # For more than 2 items, use Oxford comma for English
    if lang == "id":
        return ", ".join(items[:-1]) + f"{conjunction}{items[-1]}"
    else:
        return ", ".join(items[:-1]) + f",{conjunction} {items[-1]}"
    
# Dipakai buat ngereferensi dokumen - Zidan
def reference(response):
    source_docs = response.get('source_documents', [])
    source_strings = []

    for doc in source_docs:  # Iterate directly over source_docs
        metadata = doc.metadata  # Access metadata from each doc
        filename = metadata.get("filename", "unknown")
        
        # Extract page numbers (if present in filename)
        if "_p" in filename:
            try:
                idfile_name, page_part = filename.rsplit("_p", 1)
                base_name, id = idfile_name.rsplit("_", 1)
                page_range = page_part.split(".")[0]  # Remove extension
                start_page, end_page = page_range.split("-", 1)
                source_str = f"{base_name} halaman {start_page} sampai halaman {end_page}"
            except:
                source_str = filename  # Fallback if parsing fails
        else:
            source_str = filename

        source_strings.append(source_str)
        logger.debug(f"Source doc: {filename}")
    
    if source_strings:
            seen = set()
            unique_sources = [x for x in source_strings if not (x in seen or seen.add(x))]
            
            base_msg = "Hasil dapat tidak akurat. Silakan periksa sumber asli di:" 
            
            joined = natural_join(unique_sources, "id")
            reminder = f"\n\n{base_msg} {joined}."

    return reminder


def get_vectorstore(role_group: str):
    with vectorstore_lock:
        if vectorstore_cache[role_group] is None:
            vector_dir = os.path.join(VECTOR_DIR, role_group)
            vectorstore_cache[role_group] = Chroma(
                persist_directory=vector_dir,
                embedding_function=embed
            )
        return vectorstore_cache[role_group]

@chat_bp.route('/api/rebuild', methods=['POST'])
def api_rebuild():
    try:
        data = request.get_json()
        group = data.get("group")  # Terima parameter 'group'
        logger.info(f"Rebuild request received for group: {group}")

        # Hanya rebuild grup tertentu jika diberikan
        if group in ['mahasiswa', 'umum']:
            rebuild_chroma(group)  # Pass group untuk rebuild sesuai yang dibutuhkan
        else:
            rebuild_chroma()  # Jika tidak ada group, rebuild semuanya

        return jsonify({"message": f"Rebuilt successfully for {group}"}), 200
    except Exception as e:
        logger.error("Failed to rebuild vectorstore", exc_info=True)
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/api/chat', methods=['POST'])
def api_chat():
    try:
        data = request.get_json()
        question = data.get("message", "").strip()
        role = data.get("role", "general")
        session_id = data.get("sessionId", "default") # Extract sessionId

        K = 3 # Berapa banyak chunks yang mau di ambil? - Zidan

        start_time = time.time() # Record start time

        if not question:
            return jsonify({"answer": "Maaf, pesan tidak boleh kosong."})

        logger.info(f"Chat request received | Role: {role} | Question: {question}")

        # Get role-specific vectorstore
        role_group = "mahasiswa" if role == "mahasiswa" else "umum"
        vectordb = get_vectorstore(role_group)

        # Retrieve documents
        with vectorstore_lock:
            retrieved_docs = vectordb.similarity_search(question, k=K)

        # Prepare QA chain
        prompt = PROMPT_TEMPLATE_WITH_CONTEXT.get(role, PROMPT_TEMPLATE_WITH_CONTEXT["general"])
        logger.info(f"Isi prompr: {prompt}")

        '''
        Ada beberapa perubahan di sini:
        1. qa_chain di tambah return_source_documents agar memberikan dokumen yang digunakan
        2. Megubah result jadi dict, agar bisa menampilkan data lebih dari satu (kalau pakai .run cuma bisa menampilkan 1 data)(2 data karena ada jawaban dan source documents)
        3. Reference di ubah menjadi fungsi reference()

        -Zidan
        '''
        with vectorstore_lock:
            qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=vectordb.as_retriever(search_kwargs={"k": K}),
                return_source_documents=True,
                chain_type_kwargs={"prompt": prompt}
            )
            result = qa_chain.invoke(question)

        logger.info(f"isi dari reference: {reference(result)}")
        logger.info(f"isi dari result: {result}")

        # Extract raw answer and check for "Maaf" pattern
        raw_answer = result["result"].strip()
        
        # Determine if we should add references
        if raw_answer.lower().startswith("maaf"):
            # If apology message, use raw answer without references
            full_answer = raw_answer
        else:
            # For normal answers, add references
            reference_text = reference(result)
            full_answer = f"{raw_answer}\n{reference_text}"

        # Jika LLM gagal atau jawab kosong/aneh
        if not full_answer:
            full_answer = "Maaf, server sedang sibuk dan tidak dapat menjawab saat ini."

        logger.info("Answer generated successfully.")

        torch.cuda.empty_cache()
        return jsonify({"answer": full_answer}), 200

    except Exception as e:
        logger.error("Error during chat processing", exc_info=True)
        return jsonify({"answer": "Maaf, terjadi kesalahan saat memproses pertanyaan. Silakan coba lagi nanti."}), 500

@chat_bp.route('/api/health/chat', methods=['GET'])
def health_check_chat():
    return jsonify({"status": "ok", "service": "chat"}), 200
