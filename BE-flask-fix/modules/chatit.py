import os
import shutil
import logging
from flask import Blueprint, request, jsonify
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
                    docs.append(Document(page_content=d.page_content, metadata={"filename": filename, "group": group}))

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

        if not question:
            logger.warning("Empty question received in /api/chat")
            return jsonify({"reply": "Maaf, pesan tidak boleh kosong."})

        logger.info(f"Chat request received | Role: {role} | Question: {question}")

        embed = HuggingFaceEmbeddings()
        vectordb = Chroma(persist_directory=VECTOR_DIR, embedding_function=embed)

        prompt = PROMPT_TEMPLATE_WITH_CONTEXT.get(role, PROMPT_TEMPLATE_WITH_CONTEXT["general"])

        llm = Ollama(model="qwen2.5:7b-instruct", base_url="http://host.docker.internal:11434")

        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=vectordb.as_retriever(),
            chain_type_kwargs={"prompt": prompt}
        )

        result = qa_chain.run(question)

        logger.info("Answer generated successfully.")
        return jsonify({"answer": result}), 200

    except Exception as e:
        logger.error("Error during chat processing", exc_info=True)
        return jsonify({"error": str(e)}), 500
