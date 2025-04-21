from flask import Flask, request, jsonify
from langchain.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_chroma import Chroma
from langchain.chains import RetrievalQA
from langchain_community.llms import Ollama
from langchain.embeddings import HuggingFaceBgeEmbeddings
import os
import shutil
import textwrap

app = Flask(__name__)

# Configuration constants
DATA_PATH = "/home/amimir/Documents/zidan/Data"
CHROMA_PATH = "/home/amimir/Documents/zidan/chroma"

# Initialize the embedding model
model_name = "BAAI/bge-m3"
encode_kwargs = {'normalize_embeddings': True}
model_norm = HuggingFaceBgeEmbeddings(
    model_name=model_name,
    model_kwargs={'device': 'cuda'},
    encode_kwargs=encode_kwargs
)

# LLM initialization
llm = Ollama(model="deepseek-v2")

# Global variables for persistence
vectordb = None
qa_chain = None

def load_documents():
    loader = DirectoryLoader(DATA_PATH, glob="*md")
    documents = loader.load()
    return documents

def split_text(documents):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        length_function=len,
        add_start_index=True
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split {len(documents)} documents into {len(chunks)} chunks.")
    return chunks

def save_to_chroma(chunks):
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)

    db = Chroma.from_documents(
        chunks, model_norm, persist_directory=CHROMA_PATH
    )
    print(f"Saved {len(chunks)} chunks to {CHROMA_PATH}")
    return db

def initialize_rag_system():
    global vectordb, qa_chain
    
    # Check if the vector database already exists
    if os.path.exists(CHROMA_PATH):
        print(f"Loading existing vector database from {CHROMA_PATH}")
        vectordb = Chroma(persist_directory=CHROMA_PATH, embedding_function=model_norm)
    else:
        print("Creating new vector database")
        documents = load_documents()
        chunks = split_text(documents)
        vectordb = save_to_chroma(chunks)
    
    # Initialize the retriever and QA chain
    retriever = vectordb.as_retriever(search_kwargs={"k": 3})
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True
    )
    print("RAG system initialized successfully")

def format_source_documents(source_documents):
    formatted_sources = []
    for i, source in enumerate(source_documents):
        formatted_sources.append({
            "chunk_number": i + 1,
            "content": source.page_content,
            "source": source.metadata.get('source', 'Unknown'),
            "metadata": source.metadata
        })
    return formatted_sources

@app.route('/api/query', methods=['POST'])
def query_rag():
    data = request.json
    if not data or 'query' not in data:
        return jsonify({"error": "Query is required"}), 400
    
    query = data['query']
    
    try:
        llm_response = qa_chain(query)
        
        response = {
            "result": llm_response['result'],
            "source_documents": format_source_documents(llm_response["source_documents"])
        }
        
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/reload', methods=['POST'])
def reload_system():
    try:
        initialize_rag_system()
        return jsonify({"status": "success", "message": "RAG system reloaded successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "RAG API is running"})

# Initialize the RAG system when the application starts
print("Initializing RAG system...")
initialize_rag_system()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True)