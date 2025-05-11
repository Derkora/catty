import os
import shutil
import logging
import time # Added for response time calculation
from flask import Blueprint, request, jsonify
from threading import Lock 
from .history_utils import save_chat_history # Import from history_utils.py
from langchain.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import MarkdownHeaderTextSplitter
from langchain.document_loaders import DirectoryLoader, TextLoader
from langchain.schema import Document
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain_community.llms import Ollama

chat_bp = Blueprint('chat', __name__)
logger = logging.getLogger(__name__)

UPLOADS_MARKDOWN = "data/uploads/markdown"
VECTOR_DIR = "data/vectorstores"

vectorstore_lock = Lock()

PROMPT_TEMPLATE_WITH_CONTEXT = {
    "general": PromptTemplate(
        input_variables=["context", "question"],
        template=(
            "Kamu adalah Catty, Chatbot IT - asisten AI Departemen Teknologi Informasi ITS.\n"
            "Berikut ini adalah informasi dari dokumen yang relevan:\n"
            "{context}\n\n"
            "User: {question}\n"
            "AI: Jawablah dalam bahasa Indonesia. "
            "Jika pengguna menyampaikan kata-kata kasar atau tidak pantas, tegur dengan sopan. "
            "Bersikap ramah dan informatif dalam setiap jawaban."
            "Jika tidak ada informasi yang cukup dalam dokumen, jawab dengan \"Maaf, saya tidak menemukan informasi tersebut dalam materi ini.\" "
        )
    ),
    "mahasiswa": PromptTemplate(
        input_variables=["context", "question"],
        template=(
            "Kamu adalah Catty, Chatbot IT - asisten AI Departemen Teknologi Informasi ITS.\n"
            "Berikut ini adalah informasi dari materi kuliah dan dokumen pendukung:\n"
            "{context}\n\n"
            "User: {question}\n"
            "AI: Jawablah dengan bahasa Indonesia secara mendalam dan sesuai konteks akademik. "
            "Jika pertanyaan menyangkut mata kuliah, berikan penjelasan yang terstruktur dan mendetail. "
            "Jika ada bahasa yang tidak pantas, berikan teguran secara sopan. "
            "Tampilkan sikap profesional dan membantu sebagai asisten pembelajaran."
            "Jika tidak ditemukan informasi dalam dokumen, balas dengan \"Maaf, saya tidak menemukan informasi tersebut dalam materi kuliah ini.\" "
        )
    )
}

def rebuild_chroma(group=None):
    try:
        with vectorstore_lock:
            for group_name in ['mahasiswa', 'umum']:
                if group and group != group_name:
                    continue  # Skip jika group tidak cocok

                group_vector_dir = os.path.join(VECTOR_DIR, group_name)
                if os.path.exists(group_vector_dir):
                    shutil.rmtree(group_vector_dir)

            docs = []
            splitter = MarkdownHeaderTextSplitter(headers_to_split_on=[("#", "judul"), ("##", "subjudul")])

            for group_name in ['mahasiswa', 'umum']:
                if group and group != group_name:
                    continue  # Skip jika group tidak cocok

                dir_path = os.path.join(UPLOADS_MARKDOWN, group_name)
                if not os.path.exists(dir_path):
                    logger.warning(f"Markdown folder not found for group: {group_name}")
                    continue

                loader = DirectoryLoader(dir_path, glob="**/*.md", loader_cls=TextLoader, show_progress=True)
                for doc in loader.load():
                    filename = os.path.basename(doc.metadata['source'])
                    split_docs = splitter.split_text(doc.page_content)
                    for d in split_docs:
                        metadata = {"filename": filename, "group": group_name}
                        docs.append(Document(page_content=d.page_content, metadata=metadata))

            embed = HuggingFaceEmbeddings()

            for group_name in ['mahasiswa', 'umum']:
                if group and group != group_name:
                    continue

                group_docs = [d for d in docs if d.metadata.get("group") == group_name]
                if not group_docs:
                    logger.warning(f"Tidak ada dokumen ditemukan untuk group: {group_name}")
                    continue

                Chroma.from_documents(
                    documents=group_docs,
                    embedding=embed,
                    persist_directory=os.path.join(VECTOR_DIR, group_name)
                )
                logger.info(f"Chroma vectorstore rebuilt for group: {group_name}")


    except Exception as e:
        logger.error("Error in rebuild_chroma()", exc_info=True)
        raise e

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

        start_time = time.time() # Record start time

        if not question:
            return jsonify({"answer": "Maaf, pesan tidak boleh kosong."})

        logger.info(f"Chat request received | Role: {role} | Question: {question}")

        # Setup embedding & vectordb
        embed = HuggingFaceEmbeddings()
        role_group = "mahasiswa" if role == "mahasiswa" else "umum"
        vector_dir = os.path.join(VECTOR_DIR, role_group)
        vectordb = Chroma(persist_directory=vector_dir, embedding_function=embed)

        # Ambil dokumen terkait
        with vectorstore_lock:
            vectordb = Chroma(persist_directory=vector_dir, embedding_function=embed)
            retrieved_docs = vectordb.similarity_search(question, k=3)

        # Buat konteks dan referensi
        context = ""
        references = []
        for doc in retrieved_docs:
            filename = doc.metadata.get("filename", "unknown")
            content_preview = doc.page_content[:250].replace('\n', ' ') + "..."

            # Ekstrak nama file PDF dan halaman
            if "_p" in filename:
                base_name, page_part = filename.rsplit("_p", 1)
                page_number = ''.join(filter(str.isdigit, page_part))
                pdf_name = base_name + ".pdf"
                page_text = f"halaman {page_number}" if page_number else "halaman tidak diketahui"
                ref_line = f"- {pdf_name}, {page_text}: {content_preview}"
            else:
                pdf_name = filename.replace(".md", ".pdf")
                ref_line = f"- {pdf_name}, halaman tidak diketahui: {content_preview}"

            references.append(ref_line)
            context += f"{doc.page_content}\n"

        # Ambil prompt sesuai role
        prompt = PROMPT_TEMPLATE_WITH_CONTEXT.get(role, PROMPT_TEMPLATE_WITH_CONTEXT["general"])
        llm = Ollama(model="qwen2.5:7b-instruct", base_url="http://ollama:11434")

        with vectorstore_lock:
            qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=vectordb.as_retriever(),
                chain_type_kwargs={"prompt": prompt}
            )
            result = qa_chain.run(question)

        full_answer = result.strip()

        # Jika LLM gagal atau jawab kosong/aneh
        if not full_answer or full_answer.lower() in ["undefined", "none"]:
            full_answer = "Maaf, server sedang sibuk dan tidak dapat menjawab saat ini."

        # Tambahkan referensi jika tersedia
        if references:
            references = references[:3]  # batasi jumlah referensi
            full_answer += "\n\nReferensi:\n" + "\n".join(f"• {r}" for r in references)

        logger.info("Answer generated successfully.")

        end_time = time.time() # Record end time
        response_time = int((end_time - start_time) * 1000) # Calculate response time in ms

        # Save chat history
        save_chat_history(
            message=question,
            response=full_answer,
            role=role,
            session_id=session_id,
            response_time=response_time
        )

        return jsonify({"answer": full_answer}), 200

    except Exception as e:
        logger.error("Error during chat processing", exc_info=True)
        return jsonify({"answer": "Maaf, terjadi kesalahan saat memproses pertanyaan. Silakan coba lagi nanti."}), 500

@chat_bp.route('/api/health/chat', methods=['GET'])
def health_check_chat():
    return jsonify({"status": "ok", "service": "chat"}), 200
