# Frontend Portal Informasi Departemen Teknologi Informasi

Aplikasi frontend berbasis React dengan TypeScript dan Tailwind CSS untuk Portal Informasi Departemen Teknologi Informasi ITS.

## Fitur Utama
- Tampilan responsif untuk desktop dan mobile
- Menampilkan berita dan informasi dari backend Strapi
- Autentikasi dan halaman admin
- Komponen UI yang reusable dan modern

## Kebutuhan Sistem
- Node.js v18 atau lebih baru
- npm v9 atau lebih baru
- Git

## Panduan Memulai

### Instalasi

1. **Clone repository** (jika belum):
   ```bash
   git clone https://github.com/username/capstone-knowledge-management-system.git
   cd capstone-knowledge-management-system/FECapstone
   ```

2. **Instalasi dependensi**:
   ```bash
   npm install
   # atau
   yarn install
   ```

3. **Konfigurasi environment**:
   Buat file `.env.local` di root directory frontend dengan isi:
   ```
   VITE_STRAPI_API_URL=http://localhost:1337/api
   VITE_STRAPI_UPLOADS_URL=http://localhost:1337
   ```

### Menjalankan Aplikasi

1. **Mode Development**:
   ```bash
   npm run dev
   # atau
   yarn dev
   ```

2. **Akses aplikasi**:
   Buka [http://localhost:5173](http://localhost:5173) di browser

### Build untuk Production

1. **Membuat build**:
   ```bash
   npm run build
   # atau
   yarn build
   ```

2. **Preview hasil build**:
   ```bash
   npm run preview
   # atau
   yarn preview
   ```

## Struktur Proyek

```
FECapstone/
├── public/              # Aset statis dan gambar
├── src/                 # Kode sumber
│   ├── api/             # Konfigurasi API dan fungsi fetching
│   │   ├── layout/      # Komponen layout (Header, Footer)
│   │   └── ui/          # Komponen UI reusable
│   ├── lib/             # Utility dan helper
│   ├── pages/           # Komponen halaman
│   ├── App.tsx          # Komponen root
│   └── main.tsx         # Entry point
├── package.json         # Dependensi dan script
└── tailwind.config.js   # Konfigurasi Tailwind CSS
```

## Panduan Development

### Komponen UI
Aplikasi menggunakan pendekatan berbasis komponen dengan beberapa komponen kustom:
- Button, Card, Toast untuk UI elements
- Layout komponen untuk struktur halaman

### Styling
- Menggunakan Tailwind CSS untuk styling
- Variabel warna dan tema berada di `tailwind.config.js`

### Penamaan
- Gunakan PascalCase untuk nama komponen
- Gunakan camelCase untuk nama fungsi dan variabel

## Troubleshooting

- **Tidak bisa terhubung ke Strapi**: Pastikan Strapi sedang berjalan dan URL API di `.env.local` sudah benar
- **Module not found**: Jalankan `npm install` untuk memastikan semua dependensi terinstall
- **CSS tidak ter-load**: Pastikan PostCSS berjalan dengan benar, coba jalankan `npm run dev` ulang

