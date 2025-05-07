import os
import shutil
import logging
import time # Added for response time calculation
from flask import Blueprint, request, jsonify
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

PROMPT_TEMPLATE_WITH_CONTEXT = {
    "general": PromptTemplate(
        input_variables=["context", "question"],
        template=(
            "Kamu adalah Catty, Chatbot IT – asisten resmi Departemen Teknologi Informasi ITS.\n"
            "Berikut ini adalah informasi dari dokumen yang relevan:\n"
            "{context}\n\n"
            "User: {question}\n"
            "AI: Jawablah dalam bahasa Indonesia. Jika pertanyaan berkaitan dengan prestasi atau informasi "
            "mengenai Departemen Teknologi Informasi ITS, berikan jawaban yang mempromosikan keunggulan dan pencapaiannya. "
            "Jika tidak ada informasi yang cukup dalam dokumen, jawab dengan \"Maaf, saya tidak menemukan informasi tersebut dalam materi ini.\" "
            "Jika pengguna menyampaikan kata-kata kasar atau tidak pantas, tegur dengan sopan. "
            "Bersikap ramah dan informatif dalam setiap jawaban."
        )
    ),
    "mahasiswa": PromptTemplate(
        input_variables=["context", "question"],
        template=(
            "Kamu adalah Catty, Chatbot IT – asisten akademik Departemen Teknologi Informasi ITS.\n"
            "Berikut ini adalah informasi dari materi kuliah dan dokumen pendukung:\n"
            "{context}\n\n"
            "User: {question}\n"
            "AI: Jawablah dengan bahasa Indonesia secara mendalam dan sesuai konteks akademik. "
            "Jika pertanyaan menyangkut mata kuliah, berikan penjelasan yang terstruktur dan mendetail. "
            "Jika tidak ditemukan informasi dalam dokumen, balas dengan \"Maaf, saya tidak menemukan informasi tersebut dalam materi kuliah ini.\" "
            "Jika ada bahasa yang tidak pantas, berikan teguran secara sopan. "
            "Tampilkan sikap profesional dan membantu sebagai asisten pembelajaran."
        )
    )
}


def rebuild_chroma():
    try:
        if os.path.exists(VECTOR_DIR):
            shutil.rmtree(VECTOR_DIR)

        docs = []
        splitter = MarkdownHeaderTextSplitter(headers_to_split_on=[("#", "judul"), ("##", "subjudul")])

        for group in ['mahasiswa', 'umum']:
            dir_path = os.path.join(UPLOADS_MARKDOWN, group)
            if not os.path.exists(dir_path):
                logger.warning(f"Markdown folder not found for group: {group}")
                continue

            loader = DirectoryLoader(dir_path, glob="**/*.md", loader_cls=TextLoader, show_progress=True)
            for doc in loader.load():
                filename = os.path.basename(doc.metadata['source'])
                split_docs = splitter.split_text(doc.page_content)
                for d in split_docs:
                    metadata = {"filename": filename, "group": group}
                    if "_p" in filename:
                        page_number = ''.join(filter(str.isdigit, filename.rsplit("_p", 1)[-1]))
                        metadata["page"] = page_number
                    docs.append(Document(page_content=d.page_content, metadata=metadata))


        embed = HuggingFaceEmbeddings()
        Chroma.from_documents(docs, embed, persist_directory=VECTOR_DIR)
        logger.info("Chroma vectorstore rebuilt successfully.")

    except Exception as e:
        logger.error("Error in rebuild_chroma()", exc_info=True)
        raise e  # Important to propagate the error to the caller

@chat_bp.route('/api/rebuild', methods=['POST'])
def api_rebuild():
    try:
        logger.info("Rebuild request received.")
        rebuild_chroma()
        return jsonify({"message": "Rebuilt successfully"}), 200
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
            logger.warning("Empty question received in /api/chat")
            return jsonify({"answer": "Maaf, pesan tidak boleh kosong."})

        logger.info(f"Chat request received | Role: {role} | Question: {question}")

        # Setup embedding & vectordb
        embed = HuggingFaceEmbeddings()
        vectordb = Chroma(persist_directory=VECTOR_DIR, embedding_function=embed)

        # Ambil dokumen terkait
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
        llm = Ollama(model="qwen2.5:7b-instruct", base_url="http://host.docker.internal:11434")

        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=vectordb.as_retriever(),
            chain_type_kwargs={"prompt": prompt}
        )

        # Proses pertanyaan
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
