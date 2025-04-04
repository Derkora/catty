# Frontend Portal Informasi Departemen Teknologi Informasi

Aplikasi frontend berbasis React dengan TypeScript dan Tailwind CSS untuk Portal Informasi Departemen Teknologi Informasi ITS.

## Fitur Utama
- Tampilan responsif untuk desktop dan mobile
- Menampilkan berita dan informasi dari backend Strapi
- Asisten virtual (chatbot) dengan kemampuan render markdown
- Autentikasi dan halaman admin
- Komponen UI yang reusable dan modern

## Kebutuhan Sistem
- Node.js v18 atau lebih baru
- npm v9 atau lebih baru
- Git
- Docker dan Docker Compose (untuk menjalankan layanan backend)

## Panduan Instalasi Lengkap

### 1. Clone Repository
```bash
git clone https://github.com/username/capstone-knowledge-management-system.git
cd capstone-knowledge-management-system
```

### 2. Setup Backend Chatbot

1. Pastikan Docker dan Docker Compose sudah terinstall:
   ```bash
   docker --version
   docker-compose --version
   ```

2. Masuk ke direktori chatbot:
   ```bash
   cd chatbot
   ```

3. Jalankan container chatbot dengan Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Verifikasi container berjalan:
   ```bash
   docker-compose ps
   ```
   
   Output yang diharapkan:
   ```
   NAME      IMAGE             COMMAND           SERVICE   CREATED         STATUS         PORTS
   chatbot   chatbot-chatbot   "python app.py"   chatbot   XX minutes ago  Up XX minutes  0.0.0.0:5000->5000/tcp
   ```

### 3. Setup Frontend

1. Masuk ke direktori frontend:
   ```bash
   cd ../FECapstone
   ```

2. Install dependensi:
   ```bash
   npm install
   # atau
   yarn install
   ```

3. Tambahkan dependensi untuk markdown rendering:
   ```bash
   npm install react-markdown remark-gfm
   # atau
   yarn add react-markdown remark-gfm
   ```

4. Konfigurasi proxy di `vite.config.ts`:
   ```bash
   # Buka file vite.config.ts dan pastikan memiliki konfigurasi proxy:
   
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   
   export default defineConfig({
     plugins: [react()],
     server: {
       proxy: {
         '/api/chat': {
           target: 'http://localhost:5000',
           changeOrigin: true,
           rewrite: (path) => path.replace(/^\/api/, '')
         }
       }
     }
   })
   ```

5. Konfigurasi environment:
   Buat file `.env.local` di direktori FECapstone dengan isi:
   ```
   VITE_STRAPI_API_URL=http://localhost:1337/api
   VITE_STRAPI_UPLOADS_URL=http://localhost:1337
   ```

### 4. Menjalankan Aplikasi

1. Pastikan backend chatbot sudah berjalan (container docker aktif)

2. Jalankan frontend dalam mode development:
   ```bash
   npm run dev
   # atau
   yarn dev
   ```

3. Akses aplikasi di browser:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Chatbot API: [http://localhost:5000](http://localhost:5000)

4. Akses halaman chatbot di [http://localhost:5173/chatbot](http://localhost:5173/chatbot)

## Struktur Proyek

```
capstone-knowledge-management-system/
├── FECapstone/                      # Frontend React aplikasi
│   ├── public/                      # Aset statis dan gambar
│   │   ├── api/                     # Konfigurasi API dan fungsi fetching
│   │   ├── components/              # Komponen reusable
│   │   │   ├── layout/              # Komponen layout (Header, Footer)
│   │   │   └── ui/                  # Komponen UI reusable
│   │   ├── lib/                     # Utility dan helper
│   │   ├── pages/                   # Komponen halaman
│   │   │   └── ChatbotPage.tsx      # Halaman chatbot dengan markdown rendering
│   │   ├── App.tsx                  # Komponen root
│   │   └── main.tsx                 # Entry point
│   ├── package.json                 # Dependensi dan script
│   ├── vite.config.ts               # Konfigurasi Vite dengan proxy untuk chatbot
│   └── tailwind.config.js           # Konfigurasi Tailwind CSS
│
└── chatbot/                         # Backend aplikasi chatbot
    ├── ai/                          # Source code AI chatbot
    │   ├── app.py                   # Flask API dengan dukungan CORS
    │   ├── behaviour/               # Template prompts untuk chatbot
    │   ├── knowledge/               # Pengetahuan spesifik untuk chatbot
    │   └── templates/               # Template HTML Flask
    └── docker-compose.yml           # Konfigurasi Docker untuk menjalankan chatbot
```

## Fitur Chatbot

Chatbot mendukung format markdown dalam respons, termasuk:
- **Headers** (`#`, `##`, `###`)
- **Bold** (`**text**`) dan **Italic** (`*text*`)
- **Ordered lists** (`1. Item`)
- **Unordered lists** (`- Item`)
- **Links** (`[text](url)`)

## Troubleshooting

### Masalah Frontend
- **Tidak bisa terhubung ke Strapi**: Pastikan Strapi berjalan dan URL API di `.env.local` benar
- **Module not found**: Jalankan `npm install` untuk memastikan semua dependensi terinstall
- **CSS tidak ter-load**: Pastikan PostCSS berjalan benar, coba `npm run dev` ulang

### Masalah Chatbot
- **CORS error**: Pastikan CORS diaktifkan di backend dan proxy dikonfigurasi dengan benar di `vite.config.ts`
- **Chatbot tidak merespons**: Periksa container docker berjalan dengan `docker-compose ps`
- **Error saat menjalankan container**: Cek logs dengan `docker-compose logs chatbot`

### Merestart Layanan
```bash
# Restart frontend
cd FECapstone
npm run dev

# Restart chatbot
cd chatbot
docker-compose restart
```

## Cara Memberhentikan Project

Untuk memberhentikan project dengan benar:

### 1. Menghentikan Frontend
Tekan `Ctrl+C` di terminal tempat frontend berjalan untuk menghentikan server Vite.

### 2. Menghentikan Chatbot Container

```bash
# Masuk ke direktori chatbot
cd chatbot

# Hentikan chatbot container (tetap menyimpan data)
docker-compose stop

# Atau, untuk menghentikan dan menghapus container (menghapus semua state)
docker-compose down
```

### 3. Memeriksa Status Container

```bash
# Periksa apakah semua container sudah berhenti
docker ps

# Atau periksa container yang terkait dengan project
docker-compose ps
```

### 4. Penghentian Menyeluruh (Opsional)

Jika Anda ingin menghentikan seluruh proses Docker, termasuk network dan volume:

```bash
# Hentikan dan hapus semua container, network, dan volume project
docker-compose down -v

# Pastikan tidak ada container yang masih berjalan
docker ps -a | grep chatbot
```

Menghentikan project dengan benar akan mencegah masalah ketika menjalankan project di kemudian hari dan memastikan sumber daya sistem tidak terpakai secara tidak perlu.

## Protokol Start/Stop Layanan

Untuk menjalankan dan menghentikan layanan secara terpisah, ikuti protokol berikut:

### Menghentikan dan Menjalankan Kembali Container Ollama

```bash
# Memeriksa container yang berjalan
docker ps

# Menghentikan hanya container Ollama
docker stop ollama

# Memverifikasi container telah berhenti
docker ps

# Menjalankan kembali container Ollama
docker start ollama

# Memverifikasi container berjalan kembali
docker ps
```

### Menjalankan Kembali Seluruh Stack Chatbot

Jika Anda sudah menghentikan layanan dan ingin menjalankan kembali seluruh stack (chatbot dan Ollama):

```bash
# Masuk ke direktori chatbot
cd ~/kuliah/capstone/capstone-knowledge-management-system/chatbot

# Jalankan semua container yang didefinisikan dalam docker-compose.yml
docker-compose up -d

# Verifikasi semua container berjalan
docker ps
```

### Memeriksa API Chatbot Berfungsi

Untuk memeriksa apakah API chatbot sudah berfungsi dengan benar:

```bash
# Tes API dengan curl
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Halo, apa kabar?", "role": "general"}'
```

Jika berhasil, Anda akan menerima respons JSON dari API chatbot.

### Catatan Penting

1. Container **Ollama** berjalan di **port 11434** - ini adalah layanan model AI
2. Container **chatbot** berjalan di **port 5000** - ini adalah API Flask
3. Keduanya harus berjalan agar sistem chatbot berfungsi penuh
4. Frontend memerlukan API chatbot berjalan untuk dapat berkomunikasi dengan model AI

