### 2. Setup Backend (Strapi)
1. Buka terminal dan masuk ke direktori 'BE-strapi':
   ```
   cd BE-strapi
   ```

2. Instal semua dependensi yang diperlukan:
   ```
   npm install
   ```

3. Buat file `.env` di folder 'BE-strapi' dengan isi berikut:
   ```
   # Server
   HOST=0.0.0.0
   PORT=3000

   # Secrets
   APP_KEYS=wgskwJsFDkoosuMk5HV8pA==,OYr6a2Vuao2WN0tq7eU8LA==,edfIaeSY2nlG0PAdfI6aJg==,e2k0LGbZSG5cAgAhTJNCrQ==
   API_TOKEN_SALT=nxn0rf882MAn2fBmpakxnA==
   ADMIN_JWT_SECRET=yBzcjsnWMtYg2Y8bJrFe9Q==
   TRANSFER_TOKEN_SALT=H/chyreIVQlrJaGsk9oKow==

   # Database
   DATABASE_CLIENT=sqlite
   DATABASE_HOST=
   DATABASE_PORT=
   DATABASE_NAME=
   DATABASE_USERNAME=
   DATABASE_PASSWORD=
   DATABASE_SSL=false
   DATABASE_FILENAME=.tmp/data.db
   JWT_SECRET=WnADaxZtuwjXXmjImOPoPQ==
   ```

4. Jalankan server Strapi dalam mode pengembangan:
   ```
   docker compose up -d --build
   ```

5. Setelah server berjalan, akses panel admin Strapi di browser melalui URL:
   ```
   http://localhost:1337/admin
   ```

6. Buat akun admin baru jika diminta atau login dengan akun yang sudah ada

7. Membuat API Token:
   - Di panel admin Strapi, klik **Settings** di sidebar kiri bawah
   - Pilih **API Tokens** di bawah kategori GLOBAL SETTINGS
   - Klik tombol **Create new API Token**
   - Isi informasi berikut:
     - **Name**: Berikan nama untuk token (misalnya "Frontend Access")
     - **Description**: (opsional) Deskripsi untuk token
     - **Token duration**: Pilih "Unlimited" untuk pengembangan lokal
     - **Token type**: Pilih "Full access"
   - Klik **Save**
   - **PENTING**: Salin token yang muncul karena ini hanya akan ditampilkan sekali

## Dokumentasi Fitur Pengelolaan File Markdown

### Pengenalan
Backend Strapi ini telah dilengkapi dengan fitur khusus untuk mengelola file markdown. Fitur ini memungkinkan:
1. Penyimpanan dokumen asli
2. Pengunggahan file markdown yang telah diekstrak dari dokumen asli
3. Penyimpanan dan pengambilan file markdown untuk digunakan oleh chatbot

### Alur Kerja
Alur kerja lengkap melibatkan beberapa komponen:

1. **Pengguna mengunggah dokumen asli ke Strapi** melalui endpoint standar:
   ```
   POST /api/dokumens
   ```

2. **Aplikasi Flask ekstraksi** secara berkala memeriksa dokumen yang belum diproses:
   ```
   GET /api/dokumens-unprocessed
   ```

3. **Aplikasi Flask ekstraksi memproses dokumen**:
   - Mengunduh dokumen asli
   - Mengekstrak konten
   - Membuat file markdown

4. **Aplikasi Flask mengunggah file markdown kembali ke Strapi**:
   ```
   POST /api/dokumens/:id/upload-markdown
   ```

5. **Aplikasi Flask chatbot mengambil file markdown** untuk digunakan sebagai basis pengetahuan:
   ```
   GET /api/dokumens-markdown-files
   ```

### Struktur Model Dokumen

Model `dokumen` memiliki struktur berikut:
- `namaDokumen`: Nama dokumen (string)
- `jenisDokumen`: Jenis dokumen (enum: "Dokumen_MataKuliah", "Dokumen_Administrasi")
- `fileDokumen`: File dokumen asli (media)
- `extractedDokumen`: Konten dokumen yang diekstrak (richtext) - opsional
- `markdownFile`: File markdown yang diunggah (media)
- `isProcessed`: Status apakah dokumen telah diproses (boolean)

### Endpoint API

#### 1. Mengunggah File Markdown ke Dokumen
```
POST /api/dokumens/:id/upload-markdown
```

Parameter:
- `id`: ID dokumen di Strapi

Request body (multipart/form-data):
- `files`: File markdown yang akan diunggah

Contoh menggunakan cURL:
```bash
curl -X POST http://localhost:3000/api/dokumens/1/upload-markdown \
  -F "files=@dokumen.md"
```

#### 2. Mendapatkan Dokumen yang Belum Diproses
```
GET /api/dokumens-unprocessed
```

Mengembalikan semua dokumen dengan `isProcessed: false`.

#### 3. Mendapatkan File Markdown untuk Dokumen Tertentu
```
GET /api/dokumens/:id/markdown-file
```

Parameter:
- `id`: ID dokumen di Strapi

#### 4. Mendapatkan Semua File Markdown
```
GET /api/dokumens-markdown-files
```

Mengembalikan semua dokumen yang memiliki file markdown dengan informasi lengkap.

### Implementasi di Aplikasi Flask

#### 1. Aplikasi Flask Ekstraksi

```python
import requests
import os

def get_unprocessed_documents():
    """Mendapatkan dokumen yang belum diproses dari Strapi"""
    url = "http://localhost:3000/api/dokumens-unprocessed"
    response = requests.get(url)
    return response.json()

def download_original_document(file_url, save_path):
    """Mengunduh dokumen asli dari Strapi"""
    full_url = f"http://localhost:3000{file_url}"
    response = requests.get(full_url)
    
    with open(save_path, 'wb') as f:
        f.write(response.content)
        
    return save_path

def extract_and_create_markdown(document_path, output_path):
    """Fungsi untuk mengekstrak konten dari dokumen dan membuat file markdown"""
    # Implementasi ekstraksi konten sesuai kebutuhan
    # ...
    
    # Contoh sederhana: menulis teks ke file markdown
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# Konten yang Diekstrak\n\nIni adalah konten yang diekstrak dari dokumen.")
    
    return output_path

def upload_markdown_to_strapi(document_id, markdown_file_path):
    """Mengunggah file markdown ke dokumen di Strapi"""
    url = f"http://localhost:3000/api/dokumens/{document_id}/upload-markdown"
    
    with open(markdown_file_path, 'rb') as file:
        files = {'files': file}
        response = requests.post(url, files=files)
    
    return response.json()

def process_documents():
    """Fungsi utama untuk memproses dokumen"""
    documents = get_unprocessed_documents()
    
    for doc in documents:
        document_id = doc['id']
        
        # Pastikan dokumen memiliki file
        if doc['fileDokumen'] and len(doc['fileDokumen']) > 0:
            original_file = doc['fileDokumen'][0]
            
            # Unduh dokumen asli
            temp_file_path = f"temp_doc_{document_id}{original_file['ext']}"
            download_original_document(original_file['url'], temp_file_path)
            
            # Ekstrak dan buat markdown
            markdown_path = f"extracted_{document_id}.md"
            extract_and_create_markdown(temp_file_path, markdown_path)
            
            # Unggah markdown ke Strapi
            result = upload_markdown_to_strapi(document_id, markdown_path)
            print(f"Processed document {document_id}: {result}")
            
            # Bersihkan file sementara
            os.remove(temp_file_path)
            os.remove(markdown_path)
```

#### 2. Aplikasi Flask Chatbot

```python
import requests

def get_all_markdown_files():
    """Mendapatkan semua dokumen dengan file markdown"""
    url = "http://localhost:3000/api/dokumens-markdown-files"
    response = requests.get(url)
    return response.json()

def get_markdown_content(document_id):
    """Mendapatkan konten markdown untuk dokumen tertentu"""
    # Pertama, dapatkan metadata dokumen dengan URL file
    url = f"http://localhost:3000/api/dokumens/{document_id}/markdown-file"
    response = requests.get(url)
    data = response.json()
    
    # Kemudian ambil file markdown
    if 'markdownFile' in data and 'url' in data['markdownFile']:
        file_url = f"http://localhost:3000{data['markdownFile']['url']}"
        content_response = requests.get(file_url)
        return content_response.text
    
    return None

def load_all_knowledge_base():
    """Memuat semua dokumen markdown untuk basis pengetahuan chatbot"""
    documents = get_all_markdown_files()
    knowledge_base = []
    
    for doc in documents:
        if doc['markdownFile'] and doc['markdownFile']['url']:
            file_url = f"http://localhost:3000{doc['markdownFile']['url']}"
            content = requests.get(file_url).text
            knowledge_base.append({
                'id': doc['id'],
                'title': doc['namaDokumen'],
                'content': content
            })
    
    return knowledge_base

# Contoh penggunaan dalam aplikasi Flask
'''
from flask import Flask, request, jsonify

app = Flask(__name__)

# Muat basis pengetahuan saat aplikasi dimulai
knowledge_base = load_all_knowledge_base()

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message', '')
    
    # Implementasi chatbot yang menggunakan knowledge_base
    # ...
    
    return jsonify({'response': 'Jawaban dari chatbot'})

if __name__ == '__main__':
    app.run(debug=True)
'''
```

### Kesimpulan

Dengan implementasi ini, Strapi berfungsi sebagai pusat penyimpanan dokumen dan file markdown, sementara aplikasi Flask menangani ekstraksi konten dan fungsi chatbot. Alur kerja ini memungkinkan pengelolaan pengetahuan yang terstruktur dan efisien untuk chatbot.