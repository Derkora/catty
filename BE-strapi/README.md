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