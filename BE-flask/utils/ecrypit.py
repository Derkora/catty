from cryptography.fernet import Fernet
import os

# Simpan key ke ENV atau file permanen
SECRET_KEY = os.environ.get("ENCRYPTION_KEY") or Fernet.generate_key()
fernet = Fernet(SECRET_KEY)

def encrypt_uuid(uuid: str) -> str:
    return fernet.encrypt(uuid.encode()).decode()

def decrypt_uuid(token: str) -> str:
    return fernet.decrypt(token.encode()).decode()
