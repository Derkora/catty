# Sistem Manajemen Pengetahuan (CATTY) - Departemen Teknologi Informasi ITS

Proyek ini terdiri dari tiga komponen utama:
- **Frontend**: Aplikasi web yang dibangun dengan React.
- **Backend**: Server API yang dikelola menggunakan Strapi CMS.
- **Chatbot**: Layanan chatbot cerdas yang didukung oleh model Qwen melalui server Flask.

---

### Tim Pengembang

Berikut adalah tim yang berkontribusi dalam pengembangan proyek ini:

| Nama              | NRP                         | GitHub                                 |
| :---------------- | :---------------------------- | :-------------------------------------: |
| Steven Figo      | 5027221021          | [@Derkora](https://github.com/Derkora)      |
| Moch. Zidan Hadipratama     | 5027221052              | [@ZidanHadipratama](https://github.com/ZidanHadipratama)     |
| Naufan Zaki Luqmanulhakim   | 5027221065  | [@NaufanZaki](https://github.com/NaufanZaki)   |

---

### Tech Stack

| Komponen     | Teknologi                       |
| :----------- | :------------------------------ |
| **Frontend** | `React`, `Vite`, `Tailwind CSS` |
| **Backend** | `Strapi CMS`, `Node.js`         |
| **Chatbot** | `Flask`, `Python`, `Qwen Model` |
| **Database** | `SQLite`                    |
| **Deployment**| `Docker`                        |

---

## Panduan Instalasi dan Penggunaan

### Prasyarat

Sebelum memulai, pastikan Anda telah menginstal **[Docker](https://www.docker.com/get-started)** dan Docker Daemon sedang berjalan di sistem Anda.

### 1. Clone Repositori
Pertama, clone repositori ini ke mesin lokal Anda.
```bash
git clone https://github.com/Derkora/catty.git
cd catty
```

### 2. Konfigurasi Backend (Strapi)
Backend Strapi memerlukan file konfigurasi environment (`.env`) untuk terhubung ke database dan layanan lainnya.

- Buat file baru bernama `.env` di dalam direktori `BE-strapi/`.
- Isi dari file `.env` dapat diakses dan disalin dari tautan Google Drive berikut:
  **[Akses File .env](https://drive.google.com/drive/folders/1B9l45pT5-rzTfgudytjHPOS3ml4Pg4sJ?usp=sharing)**

### Install Container GPU (Ubuntu)
1. Konfigurasi Repository NVIDIA
```sh
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
    | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
    | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
    | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt-get update
```

2. Instal Toolkit NVIDIA
```sh
sudo apt-get install -y nvidia-container-toolkit
```

2. Konfigurasi Docker untuk Menggunakan Runtime NVIDIA
```sh
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### 4. Jalankan Proyek dengan Docker
Pastikan service Docker sudah berjalan sebelum melanjutkan.

**a. Verifikasi Status Docker (Opsional)**
```bash
sudo systemctl status docker
```
Jika tidak aktif, jalankan dengan `sudo systemctl start docker`.

**b. Build Docker Compose**
Build semua image yang dibutuhkan untuk frontend, backend, dan chatbot. Opsi `--no-cache` memastikan image dibangun dari awal.
```bash
docker compose build --no-cache
```

**c. Jalankan Kontainer Docker**
Anda dapat menjalankan semua layanan secara bersamaan menggunakan Docker Compose.

- Untuk menjalankan di *background* (detached mode):
  ```bash
  docker compose up -d
  ```
- Untuk menjalankan dan melihat log secara *real-time* di terminal:
  ```bash
  docker compose up
  ```

### 5. Konfigurasi Awal Strapi
Setelah kontainer berjalan, Anda perlu melakukan konfigurasi awal pada Strapi melalui antarmuka admin.

**a. Akses Panel Admin Strapi**
Buka browser dan navigasi ke `http://localhost:1337/admin`. Buat akun admin pertama Anda saat diminta.

**b. Tambahkan Roles & Permissions**
Navigasi ke `Settings` -> `Users & Permissions Plugin` -> `Roles`.

![UI Role Strapi](images/image.png)

Buat dua role baru dengan konfigurasi izin sebagai berikut:

- **Role 1: `Admin IT`**
  Berikan izin penuh (semua *actions*) untuk koleksi berikut:
  - `Dokumen`
  - `History`
  - `Pertanyaan Chatbot`
  - `Upload`
  - `Users Pemissions`
  > **PENTING:** Klik tombol **Save** setelah selesai.

- **Role 2: `Mahasiswa IT`**
  Berikan izin terbatas sebagai berikut:
  - `Dokumen`: `create`, `find`, `findOne`
  - `History`: `create`
  - `Pertanyaan Chatbot`: `find`, `findOne`
  - `Upload`: `find`, `findOne`
  - `Users Permissions`:
    - `Auth`: Izinkan semua kecuali `resetPassword` dan `changePassword`.
    - `Permissions`: `getPermissions`
    - `Role`: `find`, `findOne`
    - `User`: `findOne`, `find`, `me`
  > **PENTING:** Klik tombol **Save** setelah selesai.

**c. Buat User Admin Pertama**
Agar sistem memiliki user dengan role `Admin IT`, buat entri baru.
- Buka tab `Content Manager` -> `User`.
- Klik `Create new entry`.
  ![Tab User](images/image-1.png)
- Isi form dengan data berikut:
  - `username`: (pilih username Anda)
  - `email`: (masukkan email yang valid)
  - `password`: (buat password yang aman)
  - `confirmed`: **TRUE**
  - `role`: **Admin IT**
  - `history`: (biarkan kosong)
- Klik **Save** untuk menyimpan.

### 6. Akses Aplikasi Web
Selamat! Semua layanan sudah berjalan dan terkonfigurasi. Anda kini dapat mengakses aplikasi web utama melalui browser Anda.

- **URL Aplikasi**: **`http://localhost:3000/`**
---

