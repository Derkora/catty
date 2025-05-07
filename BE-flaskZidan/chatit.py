import logging
import os
import re
import shutil
import gc
import torch
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from flask import jsonify, request, Blueprint
from langchain_community.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain.chains import RetrievalQA
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain_community.llms import Ollama
from langdetect import detect
from langchain.schema import BaseRetriever, Document
from typing import List, Tuple, Dict
import chromadb
from langchain.prompts import PromptTemplate 

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
CONFIG = {
    "DATA_PATH": "./markdown",
    "CHROMA_PATHS": {
        'mahasiswa': './mahasiswachroma',
        'umum': './umumchroma'
    },
    "EMBEDDING_MODEL": "BAAI/bge-m3",
    "LLM_MODEL": "qwen2.5:7b-instruct",
    "CHUNK_SIZE": 1500,
    "CHUNK_OVERLAP": 150,
    "MAX_CONCURRENT_INIT": 2,
    "SIMILARITY_TOP_K": 4,
    "TARGET_SIMILARITY": 0.65
}

# Precompiled regex patterns
FILENAME_PATTERN = re.compile(r'^(.*?)_p(\d+-\d+)\.md$')

# Flask blueprint setup
chat_bp = Blueprint('chat', __name__)

# Global state
app_state = {
    'vectordbs': {'mahasiswa': None, 'umum': None},
    'qa_chains': {'mahasiswa': None, 'umum': None},
    'embedding_model': None,
    'executor': ThreadPoolExecutor(max_workers=CONFIG["MAX_CONCURRENT_INIT"])
}

# Custom prompt template
PROMPT_TEMPLATE = """Answer the question based only on the following context. If the context doesn't contain the answer, respond with exactly: "Sorry, I don't have that information." (English) or "Maaf, informasi tersebut tidak tersedia." (Indonesian). No extra text. If context exists, provide a detailed answer matching the question's language.

Context:
{context}

Question: {question}
Answer:"""

prompt = PromptTemplate.from_template(PROMPT_TEMPLATE)


class OptimizedRetriever(BaseRetriever):
    """Enhanced Chroma retriever with efficient similarity processing"""
    vectorstore: Chroma
    k: int = CONFIG["SIMILARITY_TOP_K"]

    def _get_relevant_documents(self, query: str) -> List[Document]:
        """Batch process documents with optimized similarity calculation"""
        results = self.vectorstore.similarity_search_with_score(
            query, k=self.k * 2
        )
        return self._process_results(results)

    def _process_results(self, results: List[Tuple[Document, float]]) -> List[Document]:
        """Filter and score documents efficiently"""
        filtered = []
        for doc, score in results:
            similarity = 1 - (score / 2)
            if similarity >= CONFIG["TARGET_SIMILARITY"]:
                doc.metadata.update({
                    "raw_score": score,
                    "similarity_score": round(similarity, 3)
                })
                filtered.append(doc)
            if len(filtered) >= self.k:
                break
        return filtered


def initialize_embedding_model():
    """Initialize embedding model with performance optimizations"""
    if app_state['embedding_model'] is None:
        logger.info("Initializing embedding model with CUDA acceleration")
        app_state['embedding_model'] = HuggingFaceBgeEmbeddings(
            model_name=CONFIG["EMBEDDING_MODEL"],
            model_kwargs={
                'device': 'cuda',
                'torch_dtype': torch.float16
            },
            encode_kwargs={
                'normalize_embeddings': True,
                'batch_size': 32
            }
        )


def validate_chroma(chroma_path: str) -> Tuple[bool, str]:
    """Fast validation of Chroma DB integrity"""
    db_file = os.path.join(chroma_path, "chromite.sqlite3")
    if not os.path.exists(db_file):
        return False, "Missing database file"
    
    try:
        with sqlite3.connect(db_file, timeout=10) as conn:
            return (conn.execute("SELECT 1 FROM embeddings LIMIT 1").fetchone() is not None,
                    "Valid database")
    except Exception as e:
        return False, f"Validation error: {str(e)}"


def chunk_documents(docs: List[Document]) -> List[Document]:
    """Efficient document splitting with parallel processing"""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CONFIG["CHUNK_SIZE"],
        chunk_overlap=CONFIG["CHUNK_OVERLAP"],
        length_function=len
    )
    return splitter.split_documents(docs)


def initialize_category(category: str):
    """Parallel-safe ChromaDB initialization for a single category"""
    chroma_path = CONFIG["CHROMA_PATHS"][category]
    data_path = os.path.join(CONFIG["DATA_PATH"], category)
    
    try:
        # Attempt fast loading of existing database
        if os.path.exists(chroma_path):
            vs = Chroma(
                persist_directory=chroma_path,
                embedding_function=app_state['embedding_model'],
            )
            if vs._collection.count() > 0:
                app_state['vectordbs'][category] = vs
                logger.info(f"Loaded existing ChromaDB for {category}")
                return

        # Build new database
        logger.info(f"Building new ChromaDB for {category}")
        loader = DirectoryLoader(data_path, glob="**/*.md", silent_errors=True)
        chunks = chunk_documents(loader.load())
        
        vs = Chroma.from_documents(
            documents=chunks,
            embedding=app_state['embedding_model'],
            persist_directory=chroma_path,
            client_settings=chromadb.config.Settings(anonymized_telemetry=False)
        )
        app_state['vectordbs'][category] = vs
        logger.info(f"Created ChromaDB for {category} with {len(chunks)} chunks")
    
    except Exception as e:
        logger.error(f"Failed initializing {category}: {str(e)}")
        if os.path.exists(chroma_path):
            shutil.rmtree(chroma_path)


def initialize_rag_system():
    """Parallel initialization of all RAG components"""
    logger.info("Starting parallel RAG initialization")
    futures = []
    
    for category in CONFIG["CHROMA_PATHS"]:
        if os.path.exists(os.path.join(CONFIG["DATA_PATH"], category)):
            futures.append(
                app_state['executor'].submit(initialize_category, category)
            )
    
    for future in futures:
        future.result()
    
    # Build QA chains after initialization
    for category in app_state['vectordbs']:
        if app_state['vectordbs'][category]:
            retriever = OptimizedRetriever(vectorstore=app_state['vectordbs'][category])
            app_state['qa_chains'][category] = RetrievalQA.from_chain_type(
                llm=Ollama(model=CONFIG["LLM_MODEL"], temperature=0.3),
                chain_type="stuff",
                retriever=retriever,
                return_source_documents=True,
                chain_type_kwargs={"prompt": prompt}
            )
    
    logger.info("RAG system initialization complete")


def process_sources(docs: List[Document], lang: str) -> Tuple[List[Dict], List[float]]:
    """Efficient source processing with regex parsing"""
    sources = []
    scores = []
    
    for doc in docs:
        meta = doc.metadata
        source_path = meta.get('source', '')
        filename = os.path.basename(source_path)
        
        # Regex-based filename parsing
        match = FILENAME_PATTERN.match(filename)
        if match:
            base_name, pages = match.groups()
            doc_name = f"{os.path.basename(os.path.dirname(source_path))}/{base_name}"
            source_str = f"{doc_name} {'halaman' if lang == 'id' else 'pages'} {pages}"
            
            sources.append({
                "document": doc_name,
                "pages": pages,
                "content": doc.page_content[:400] + "...",
                "similarity": meta.get("similarity_score", 0)
            })
            scores.append(meta.get("similarity_score", 0))
    
    return sources, scores


@chat_bp.route('/chat', methods=['POST'])
def handle_query():
    """Optimized query handler with batched processing"""
    try:
        data = request.get_json()
        query = data['message']
        category = data.get('category', 'mahasiswa')
        qa_chain = app_state['qa_chains'].get(category)
        
        if not qa_chain:
            return jsonify({"error": "Uninitialized category"}), 400
        
        # Parallel processing of query and language detection
        lang_future = app_state['executor'].submit(detect, query)
        rag_future = app_state['executor'].submit(qa_chain.invoke, query)
        response = rag_future.result()
        detected_lang = lang_future.result()[:2]
        
        response_text = response.get('result', '')
        sources, scores = process_sources(response.get('source_documents', []), detected_lang)
        
        # Build confidence metrics
        confidence = max(scores) if scores else 0
        quality = (
            "excellent" if confidence >= 0.85 else
            "good" if confidence >= 0.7 else
            "fair" if confidence >= 0.5 else
            "poor"
        )
        
        # Build final response
        return jsonify({
            "reply": response_text,
            "sources": sources,
            "confidence": round(confidence, 3),
            "quality": quality,
            "language": detected_lang
        })
    
    except Exception as e:
        logger.error(f"Query error: {str(e)}")
        return jsonify({"error": "Processing failed"}), 500


@chat_bp.route('/api/rebuild', methods=['POST'])
def rebuild_system():
    """Efficient system rebuild with resource cleanup"""
    try:
        logger.info("Starting optimized rebuild")
        
        # Parallel cleanup
        futures = []
        for path in CONFIG["CHROMA_PATHS"].values():
            if os.path.exists(path):
                futures.append(app_state['executor'].submit(shutil.rmtree, path))
        
        for future in futures:
            future.result()
        
        # Resource cleanup
        chromadb.api.client.SharedSystemClient.clear_system_cache()
        torch.cuda.empty_cache()
        gc.collect()
        
        # Reinitialize system
        initialize_rag_system()
        return jsonify({"status": "Rebuild successful"})
    
    except Exception as e:
        logger.error(f"Rebuild failed: {str(e)}")
        return jsonify({"error": "Rebuild failed"}), 500


if __name__ == '__main__':
    try:
        initialize_embeddings()
        initialize_rag_system()
        chat_bp.run(host='0.0.0.0', port=5003, threaded=True)
    finally:
        app_state['executor'].shutdown()