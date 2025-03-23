# Portal Informasi Departemen Teknologi Informasi ITS

Repository ini berisi dua proyek terpisah untuk sistem Portal Informasi Departemen Teknologi Informasi ITS:

## Struktur Repository
```
capstone-knowledge-management-system/
├── FECapstone/   # Frontend React dengan TypeScript & Tailwind
└── BECapstone/   # Backend menggunakan Strapi CMS
```

## Petunjuk Menjalankan Aplikasi

### Frontend
Untuk menjalankan aplikasi frontend, silakan baca [dokumentasi frontend](./FECapstone/README.md).

### Backend
Untuk menjalankan backend Strapi, silakan baca [dokumentasi backend](./BECapstone/README.md).

## Prasyarat Menjalankan Proyek

- Node.js v18 atau lebih baru
- npm v9 atau lebih baru (atau yarn)
- Git

## Langkah Cepat Menjalankan Proyek

1. **Menjalankan Backend**:
   ```bash
   cd BECapstone
   npm install
   npm run develop
   ```
   Backend akan berjalan di http://localhost:1337

2. **Menjalankan Frontend**:
   ```bash
   cd FECapstone
   npm install
   npm run dev
   ```
   Frontend akan berjalan di http://localhost:5173

Untuk informasi lebih detail, silakan merujuk ke README masing-masing proyek.

## Kontributor
- Tim Pengembang Capstone

## Lisensi
Hak Cipta © Departemen Teknologi Informasi ITS
