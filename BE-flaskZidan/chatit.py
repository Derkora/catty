from flask import Flask, request, jsonify
from langchain_community.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain.chains import RetrievalQA
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain_community.llms import Ollama
from langdetect import detect
from langchain.schema import BaseRetriever, Document
from typing import List
import os
import shutil
import gc
import torch
import sqlite3

import chromadb

from typing import List, Tuple

from flask import Blueprint, jsonify, request, current_app
# ... keep other imports ...

chat_bp = Blueprint('chat', __name__)

# Configuration constants
DATA_PATH = "./markdown"
CHROMA_PATHS = {
    'mahasiswa': './mahasiswachroma',
    'umum': './umumchroma'
}


from langchain.prompts import PromptTemplate 
CUSTOM_PROMPT_TEMPLATE = """Answer the question based only on the following context. If the context does not contain the information needed to answer the question, respond with exactly: "Sorry, I don't have the information needed to answer your question." if the question is in English, or "Maaf, saya tidak memiliki informasi yang diperlukan untuk menjawab pertanyaan Anda." if the question is in Indonesian. Do not add any extra text. If the context is sufficient, provide a detailed answer in the same language as the question.

Context:
{context}

Question: {question}
Answer:"""

PROMPT = PromptTemplate(
    template=CUSTOM_PROMPT_TEMPLATE,
    input_variables=["context", "question"]
)


class CustomChromaRetriever(BaseRetriever):
    # Declare Pydantic fields here:
    vectorstore: Chroma
    k: int = 3

    def _get_relevant_documents(self, query: str) -> List[Document]:
        # Get raw distances
        docs_with_scores = self.vectorstore.similarity_search_with_score(query, k=self.k)
        # Convert distance -> similarity (0..1) and attach to metadata
        for doc, distance in docs_with_scores:
            sim = 1 - (distance / 2)  # map [0..2] -> [1..0]
            doc.metadata["raw_score"] = distance
            doc.metadata["similarity_score"] = sim
        return [doc for doc, _ in docs_with_scores]

    async def _aget_relevant_documents(self, query: str) -> List[Document]:
        # Simply call the sync version
        return self._get_relevant_documents(query)

# Initialize the embedding model
model_name = "BAAI/bge-m3"
encode_kwargs = {'normalize_embeddings': True}
model_norm = HuggingFaceBgeEmbeddings(
    model_name=model_name,
    model_kwargs={'device': 'cuda'},
    encode_kwargs=encode_kwargs
)

# LLM initialization
llm = Ollama(model="qwen2.5:7b-instruct", base_url="http://host.docker.internal:11434")

# Global variables for persistence
vectordbs = {
    'mahasiswa': None,
    'umum': None
}

qa_chains = {
    'mahasiswa': None,
    'umum': None
}

def initialize_embedding_model():
    global model_norm
    if model_norm is None:
        model_norm = HuggingFaceBgeEmbeddings(
            model_name=model_name,
            model_kwargs={'device': 'cuda'},
            encode_kwargs=encode_kwargs
        )

def check_chroma_db(chroma_path):
    """Check if Chroma DB is properly initialized"""
    chroma_db_path = os.path.join(chroma_path, "chroma.sqlite3")
    try:
        if not os.path.exists(chroma_db_path):
            return False, "Chroma DB file not found"
            
        with sqlite3.connect(chroma_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            if not any('embeddings' in table[0] for table in tables):
                return False, "Chroma DB tables missing"
                
        return True, "Chroma DB OK"
    except Exception as e:
        return False, str(e)

def load_documents_for_category(category):
    """Load documents for a specific category"""
    category_path = os.path.join(DATA_PATH, category)
    try:
        loader = DirectoryLoader(
            category_path, 
            glob="**/*.md", 
            recursive=True,
            silent_errors=True
        )
        docs = loader.load()
        if not docs:
            raise ValueError(f"No markdown files found in {category_path}")
        return docs
    except Exception as e:
        raise RuntimeError(f"Document loading failed for {category}: {str(e)}")
    


def load_documents_for_category(category):
    """Load documents for a specific category"""
    category_path = os.path.join(DATA_PATH, category)
    try:
        loader = DirectoryLoader(
            category_path, 
            glob="**/*.md", 
            recursive=True,
            silent_errors=True
        )
        docs = loader.load()
        if not docs:
            raise ValueError(f"No markdown files found in {category_path}")
        return docs
    except Exception as e:
        raise RuntimeError(f"Document loading failed for {category}: {str(e)}")


def initialize_category_rag(category):
    global vectordbs, qa_chains
    
    chroma_path = CHROMA_PATHS[category]
    
    if os.path.exists(chroma_path):
        try:
            # Try to load existing database
            vectordb = Chroma(
                persist_directory=chroma_path,
                embedding_function=model_norm,
            )
            if vectordb._collection.count() > 0:
                vectordbs[category] = vectordb
                print(f"Loaded existing ChromaDB for {category}")
                return
        except Exception as e:
            print(f"Failed to load existing ChromaDB for {category}: {str(e)}")
            shutil.rmtree(chroma_path)

    # Create new database
    print(f"Building new vector database for {category}")
    try:
        documents = load_documents_for_category(category)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100,
            length_function=len
        )
        chunks = text_splitter.split_documents(documents)
        
        vectordb = Chroma.from_documents(
            documents=chunks,
            embedding=model_norm,
            persist_directory=chroma_path
        )
        vectordbs[category] = vectordb
        print(f"Created new DB for {category} with {len(chunks)} chunks")
    except Exception as e:
        raise RuntimeError(f"DB initialization failed for {category}: {str(e)}")

def initialize_rag_system():
    for category in ['mahasiswa', 'umum']:
        try:
            if os.path.exists(os.path.join(DATA_PATH, category)):
                initialize_category_rag(category)
                # Create QA chain with custom retriever and prompt
                retriever = CustomChromaRetriever(vectorstore=vectordbs[category], k=3)
                qa_chains[category] = RetrievalQA.from_chain_type(
                    llm=llm,
                    chain_type="stuff",
                    retriever=retriever,
                    return_source_documents=True,
                    chain_type_kwargs={"prompt": PROMPT}  # Added custom prompt
                )
                print(f"RAG system initialized successfully for {category}")
            else:
                print(f"Skipping {category} - directory not found")
        except Exception as e:
            print(f"Failed to initialize {category}: {str(e)}")


def format_source_documents(source_documents):
    return [{
        "chunk_number": i + 1,
        "content": source.page_content,
        "source": source.metadata.get('source', 'Unknown'),
        "metadata": source.metadata
    } for i, source in enumerate(source_documents)]

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

@chat_bp.route('/api/health', methods=['GET'])
def health_check():
    try:
        health_info = {
            "status": "healthy",
            "categories": {}
        }
        
        for category in ['akademik', 'administrasi', 'umum']:
            chroma_path = CHROMA_PATHS[category]
            db_status, db_msg = check_chroma_db(chroma_path)
            
            health_info["categories"][category] = {
                "chroma_db": db_msg,
                "vector_db_initialized": vectordbs[category] is not None,
                "qa_chain_ready": qa_chains[category] is not None
            }
        
        health_info["model_loaded"] = model_norm is not None
        return jsonify(health_info)
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500
    

@chat_bp.route('/api/query', methods=['POST'])
def query_rag_backward_compatible():
    return query_rag()


@chat_bp.route('/chat', methods=['POST'])  # Changed from /api/query
def query_rag():
    response_template = {
        "result": None,
        "sources": [],
        "context_quality": "unknown",
        "confidence_score": 0.0,
        "error": None,
        "warnings": [],
        "sorry?": None
    }
    
    try:
        data = request.json
        if not data or 'query' not in data:
            raise ValueError("Query parameter is required")
            
        query = data['query']
        category = data.get('category', 'akademik')

        if category not in qa_chains or not qa_chains[category]:
            raise ValueError(f"Invalid category or uninitialized: {category}")

        llm_response = qa_chains[category].invoke(query)
        response_text = llm_response.get('result', '').strip()

        # Detect language from response instead of query
        try:
            detected_lang = detect(response_text) if len(response_text) > 10 else 'en'
        except:
            detected_lang = 'en'

        # Define all possible sorry messages
        sorry_messages = {
            'en': [
                "Sorry, I don't have the information needed to answer your question.",
                "Sorry, I don't have the information needed to answer your question"
            ],
            'id': [
                "Maaf, saya tidak memiliki informasi yang diperlukan untuk menjawab pertanyaan Anda.",
                "Maaf, saya tidak memiliki informasi yang diperlukan untuk menjawab pertanyaan Anda"
            ]
        }

        # Check if response contains any sorry message
        response_is_sorry = False
        for lang in ['en', 'id']:
            if any(msg in response_text for msg in sorry_messages[lang]):
                response_is_sorry = True
                detected_lang = lang  # Update language based on response
                break

        # Process sources and scores
        source_strings = []
        valid_sources = []
        scores = []
        
        if llm_response.get('source_documents'):
            for doc in llm_response['source_documents']:
                try:
                    score = doc.metadata.get("similarity_score", 0)
                    scores.append(score)
                    
                    source_path = doc.metadata.get('source', 'Unknown')
                    filename = os.path.basename(source_path)
                    folder_name = os.path.basename(os.path.dirname(source_path))
                    
                    if '_p' in filename:
                        base_name, page_part = filename.rsplit('_p', 1)
                        page_range = page_part.split('.')[0]
                        
                        if '-' in page_range:
                            start_page, end_page = page_range.split('-', 1)
                            if start_page.isdigit() and end_page.isdigit():
                                doc_name = f"{folder_name}/{base_name}"
                                
                                source_str = (f"{doc_name} halaman {start_page}-{end_page}" 
                                             if detected_lang == 'id' 
                                             else f"{doc_name} pages {start_page}-{end_page}")
                                
                                source_strings.append(source_str)
                                valid_sources.append({
                                    "document": doc_name,
                                    "pages": f"{start_page}-{end_page}",
                                    "content": doc.page_content[:500] + "...",
                                    "similarity_score": score
                                })
                except Exception as e:
                    response_template['warnings'].append(f"Source processing error: {str(e)}")

        # Calculate confidence scores
        if scores:
            best = max(scores)
            response_template['confidence_score'] = round(best, 3)
            response_template['context_quality'] = (
                "excellent" if best >= 0.85 else
                "good" if best >= 0.70 else
                "fair" if best >= 0.50 else
                "poor"
            )
        else:
            response_template['confidence_score'] = 0.0
            response_template['context_quality'] = "poor"

        # Format final response
        reminder = ""
        if not response_is_sorry and source_strings:
            seen = set()
            unique_sources = [x for x in source_strings if not (x in seen or seen.add(x))]
            
            base_msg = ("Hasil dapat tidak akurat. Silakan periksa sumber asli di:" 
                       if detected_lang == 'id' 
                       else "Results may be inaccurate. Please check original sources at:")
            
            joined = natural_join(unique_sources, detected_lang)
            reminder = f"\n\n{base_msg} {joined}."

        # Clean up sorry messages
        if response_is_sorry:
            # Remove any potential extra text after sorry message
            for msg in sorry_messages[detected_lang]:
                if msg in response_text:
                    response_text = msg
                    break

        response_template['result'] = f"{response_text}{reminder}".strip()
        response_template['sources'] = valid_sources
        response_template["sorry?"] = response_is_sorry
        
        return jsonify(response_template)
    except Exception as e:
        response_template['error'] = str(e)
        return jsonify(response_template), 500

@chat_bp.route('/api/rebuild', methods=['POST'])
def rebuildrag():
    try:
        for category in CHROMA_PATHS.values():
            if os.path.exists(category):
                shutil.rmtree(category)
        
        chromadb.api.client.SharedSystemClient.clear_system_cache()

        global vectordbs, qa_chains
        vectordbs = {k: None for k in vectordbs}
        qa_chains = {k: None for k in qa_chains}
        gc.collect()
        torch.cuda.empty_cache()
        
        initialize_rag_system()
        return jsonify({"status": "rebuild completed"})
    except Exception as e:
        return jsonify({"status": "rebuild failed", "error": str(e)}), 500


from flask import send_from_directory

@chat_bp.route('/')
def serve_index():
    return send_from_directory('templates', 'index.html')

if __name__ == '__main__':
    try:
        initialize_embedding_model()
        initialize_rag_system()
        chat_bp.run(host='0.0.0.0', port=5003, debug=False)
    except Exception as e:
        print(f"Failed to initialize system: {str(e)}")
        exit(1)