# Panduan Instalasi dan Penggunaan Knowledge Management System Departemen Teknologi Informasi

## Pendahuluan
Sistem Knowledge Management ini terdiri dari dua bagian utama:
- **Frontend**: Aplikasi web yang dibangun dengan React (dalam folder 'FECapstone')
- **Backend**: Server API yang dibangun dengan Strapi CMS (dalam folder 'BE-strapi')
- 

## Persyaratan Sistem
Sebelum memulai, pastikan Anda telah menginstal:
- [Node.js](https://nodejs.org/) (versi 14.x atau lebih baru)
- [npm](https://www.npmjs.com/) (biasanya terinstal bersama Node.js)
- [Git](https://git-scm.com/)

## Langkah-Langkah Instalasi dan Menjalankan Aplikasi

### 1. Persiapan Backend Chatbot

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
   npm run develop
   ```

5. Setelah server berjalan, akses panel admin Strapi di browser melalui URL:
   ```
   http://localhost:3000/admin
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

### 3. Setup Frontend (React)
1. Buka terminal baru dan masuk ke direktori 'FECapstone':
   ```
   cd FECapstone
   ```

2. Instal semua dependensi yang diperlukan:
   ```
   npm install
   ```

3. Buat file `.env` di folder 'FECapstone' dengan isi berikut (ganti `[API Token]` dengan token yang Anda dapatkan dari langkah 7 di atas):
   ```
   REACT_APP_API_TOKEN="[API Token]"
   REACT_APP_API_BASE_URL="http://localhost:3000"
   ```

4. Buat file `env.js` di folder 'FECapstone/public/' dengan isi berikut (ganti `[API Token]` dengan token yang sama):
   ```javascript
   // This script helps load environment variables into the browser
   window.__ENV = window.__ENV || {};
   window.__ENV.REACT_APP_API_TOKEN = "[API Token]";
   window.__ENV.REACT_APP_API_BASE_URL = "http://localhost:3000";
   ```

5. Jalankan aplikasi frontend dalam mode pengembangan:
   ```
   npm run dev
   ```

6. Setelah berhasil dijalankan, akses aplikasi di browser melalui URL:
   ```
   http://localhost:5173
   ```

### 4. Setup Catty - chatbot Departemen Teknologi Informasi dan Converter PDF to MD
1. Buka terminal baru dan menuju folder BE-Flask-fix
2. Jalankan command `docker compose up -d`. Tunggu hingga build dan menjalankan dockernya selesai.
3. Buka terminal baru juga, jalankan ollama dan model Qwen2.5:7b-instruct
4. Setelah selesai, tunggu sampai log ini keluar, dan app siap diapakai!
   ```
   2025-05-13 02:50:50,629 - INFO - __main__ - Background worker thread started.
   2025-05-13 02:50:50,634 - INFO - __main__ - Starting server on port 5000
   2025-05-13 02:50:50,641 - INFO - waitress - Serving on http://0.0.0.0:5000⁠
   ```
   

### 6. Cara Penggunaan Aplikasi
- **Dashboard Admin** (untuk mengelola dokumen): Akses melalui `/admin-dashboard`
- **Dashboard Pengguna** (untuk melihat dokumen): Akses melalui halaman utama

## Pemecahan Masalah (Troubleshooting)

### Masalah Koneksi ke Backend
- Pastikan server Strapi (backend) berjalan di port 3000
- Cek apakah token API sudah benar di file `.env` dan `env.js`
- Periksa konsol browser untuk pesan error yang mungkin muncul

### Masalah Database
- Jika ada masalah dengan database, coba hapus folder `.tmp` di direktori 'BE-strapi' dan restart server

### Masalah Instalasi Package
- Jika ada masalah dengan instalasi package, coba hapus folder `node_modules` dan file `package-lock.json`, kemudian jalankan `npm install` lagi

### Masalah Lainnya
- Pastikan versi Node.js Anda kompatibel (disarankan versi 14.x atau lebih baru)
- Cek koneksi internet saat proses instalasi package

## Catatan Tambahan
- Aplikasi ini menggunakan SQLite sebagai database default, sehingga tidak perlu setup database terpisah
- Untuk produksi, disarankan untuk mengubah konfigurasi database dan secrets

Jika Anda memiliki pertanyaan lebih lanjut atau mengalami masalah, jangan ragu untuk menghubungi tim pengembang.
