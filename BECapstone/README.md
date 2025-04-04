# Backend Strapi - Portal Informasi Departemen Teknologi Informasi

Backend berbasis Strapi CMS untuk Portal Informasi Departemen Teknologi Informasi ITS. Strapi digunakan sebagai Headless CMS untuk mengelola konten yang ditampilkan di frontend.

## Fitur Utama
- API RESTful untuk akses data
- Panel admin untuk pengelolaan konten
- Sistem manajemen user dan otentikasi
- Upload dan manajemen media
- Content versioning dan draft

## Kebutuhan Sistem
- Node.js v18 atau lebih baru (Disarankan LTS)
- npm v9 atau lebih baru atau yarn
- Database (MySQL, PostgreSQL, SQLite)

## Panduan Memulai

### Instalasi

1. **Clone repository** (jika belum):
   ```bash
   git clone https://github.com/username/capstone-knowledge-management-system.git
   cd capstone-knowledge-management-system/BECapstone
   ```

2. **Instalasi dependensi**:
   ```bash
   npm install
   # atau
   yarn install
   ```

3. **Konfigurasi database**:
   - Periksa file `config/database.js` untuk konfigurasi database
   - Pastikan database yang disebutkan sudah tersedia

### Menjalankan Strapi

1. **Mode Development**:
   ```bash
   npm run develop
   # atau
   yarn develop
   ```

2. **Akses Admin Panel**:
   - Buka [http://localhost:1337/admin](http://localhost:1337/admin) di browser
   - Pada pertama kali mengakses, ikuti langkah-langkah untuk membuat pengguna admin

### Deployment untuk Production

1. **Build aplikasi**:
   ```bash
   npm run build
   # atau
   yarn build
   ```

2. **Jalankan dalam mode production**:
   ```bash
   NODE_ENV=production npm run start
   # atau
   NODE_ENV=production yarn start
   ```

## Struktur Content Types

### Berita (News)
Content type untuk artikel berita dengan atribut:
- Title (String) - Judul berita
- Description (Text) - Deskripsi singkat
- Content (Rich Text) - Konten lengkap berita
- Image (Media) - Gambar sampul
- PublishedAt (Date) - Tanggal publikasi
- Author (Relation) - Relasi ke user

### Halaman (Pages)
Content type untuk halaman statis:
- Title (String) - Judul halaman
- Slug (String) - URL halaman
- Content (Rich Text) - Konten halaman
- IsPublished (Boolean) - Status publikasi

## API Endpoints

### Berita (News)
- `GET /api/news` - Ambil semua berita
- `GET /api/news/:id` - Ambil berita berdasarkan ID
- `POST /api/news` - Buat berita baru (memerlukan otentikasi)
- `PUT /api/news/:id` - Update berita (memerlukan otentikasi)
- `DELETE /api/news/:id` - Hapus berita (memerlukan otentikasi)

### Halaman (Pages)
- `GET /api/pages` - Ambil semua halaman
- `GET /api/pages/:id` - Ambil halaman berdasarkan ID
- `GET /api/pages/by-slug/:slug` - Ambil halaman berdasarkan slug

## Konfigurasi Lanjutan

### Environment Variables
Buat file `.env` di root direktori dengan variabel berikut:
```
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys
API_TOKEN_SALT=your-token-salt
ADMIN_JWT_SECRET=your-jwt-secret
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

### Plugins Terinstall
- Upload - Manajemen media
- Graphql - API GraphQL (opsional)
- Documentation - Dokumentasi API Swagger

### Roles & Permissions
Atur akses dan permissions di admin panel:
1. Buka Admin Panel
2. Navigasi ke Settings > Roles
3. Edit roles yang ada atau buat baru
4. Atur permissions untuk setiap role

## Troubleshooting

- **Koneksi Database Error**: Pastikan kredensial database sudah benar dan database server berjalan
- **Permission Error**: Periksa pengaturan CORS dan permissions di Strapi admin
- **Upload Error**: Pastikan direktori uploads (`public/uploads`) memiliki permission yang benar

## Backup & Restore

### Backup Database
```bash
# SQLite
cp .tmp/data.db ./backup/data.db.backup

# MySQL/PostgreSQL
# Gunakan tools database seperti mysqldump atau pg_dump
```

### Backup Media
```bash
cp -r public/uploads ./backup/uploads
```
