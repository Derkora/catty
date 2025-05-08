import os
import requests
import logging
from flask import Blueprint, jsonify
from datetime import datetime

# Inisialisasi Blueprint dan Logger
history_bp = Blueprint('history', __name__)
logger = logging.getLogger(__name__)

# === Strapi Configuration ===
STRAPI_URL = os.getenv("STRAPI_URL", "http://localhost:1337") # Default if not set

def save_chat_history(message, response, role, session_id, response_time):
    try:
        # Convert role to match Strapi enum (assuming 'mahasiswa' and 'public'/'general')
        user_type = "mahasiswa" if role == "mahasiswa" else "public"
        
        history_data = {
            "data": {
                "message": message,
                "response": response,
                "userType": user_type, # Ensure this matches your Strapi collection field name
                "sessionId": session_id,
                "responseTime": response_time,
                "timestamp": datetime.utcnow().isoformat(),
                "publishedAt": datetime.utcnow().isoformat() # Strapi typically requires publishedAt for new entries
            }
        }
        
        headers = {
            "Content-Type": "application/json"
            # Add Authorization header if your Strapi API requires it
            # "Authorization": f"Bearer {YOUR_STRAPI_API_TOKEN}"
        }
        
        strapi_response = requests.post(f"{STRAPI_URL}/api/histories", json=history_data, headers=headers)
        if strapi_response.status_code not in [200, 201]: # 201 is often used for successful POST creating a resource
            logger.error(f"Failed to save history to Strapi: {strapi_response.status_code} - {strapi_response.text}")
            return False
        logger.info(f"Chat history saved successfully to Strapi for session {session_id}")
        return True
    except Exception as e:
        logger.error(f"Error saving history to Strapi: {e}", exc_info=True)
        return False
    
@history_bp.route('/api/health/history', methods=['GET'])
def health_check_crudit():
    return jsonify({"status": "ok", "service": "crudit"}), 200
