# Konfigurasi Environment Variables

Dokumentasi ini menjelaskan semua variabel environment yang dibutuhkan oleh backend e-commerce.

## Cara Setup

```bash
# 1. Salin template
cp .env.example .env

# 2. Edit .env dan isi nilai yang valid
# 3. Validasi otomatis dijalankan saat startup aplikasi
```

Jika ada variabel yang tidak valid atau tidak diisi, aplikasi akan melempar error saat startup (`src/config/env.ts`) dan menampilkan pesan error.

## Variabel Aplikasi

| Variabel | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `NODE_ENV` | No | `development` | Mode aplikasi: `development`, `production`, atau `test` |
| `PORT` | No | `3000` | Port yang didengarkan server |
| `HOST` | No | `0.0.0.0` | Bind address server |

## Variabel Database

| Variabel | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `DATABASE_HOST` | Yes | - | Host MariaDB (contoh: `localhost`) |
| `DATABASE_PORT` | No | `3306` | Port MariaDB |
| `DATABASE_USER` | Yes | - | Username database |
| `DATABASE_PASSWORD` | Yes | - | Password database |
| `DATABASE_NAME` | Yes | - | Nama database |

### Docker MariaDB

Docker Compose juga menggunakan variabel berikut secara tidak langsung:

| Variabel | Default | Deskripsi |
|----------|---------|-----------|
| `DATABASE_ROOT_PASSWORD` | `root_sandi_skripsi_aman` | Password root MariaDB (hanya untuk Docker) |

> **Catatan:** `DATABASE_ROOT_PASSWORD` hanya dipakai oleh Docker Compose dan tidak perlu diisi di `.env` kecuali kamu ingin mengubah password root MariaDB.

## Variabel Autentikasi

| Variabel | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `JWT_SECRET` | Yes | - | Secret key untuk sign/verify JWT token |
| `COOKIE_SECRET` | Yes | - | Secret key untuk sign cookies |

### Tips Keamanan

- Gunakan string acak yang panjang (minimal 32 karakter)
- Jangan gunakan nilai yang mudah ditebak
- Contoh generate secret:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

## Variabel Cookie

| Variabel | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `COOKIE_SAMESITE` | No | `lax` | SameSite policy cookie: `strict`, `lax`, atau `none` |
| `COOKIE_SECURE` | No | `false` | Cookie hanya dikirim via HTTPS (wajib `true` di production) |
| `COOKIE_DOMAIN` | No | - | Domain scope cookie (contoh: `.example.com` untuk subdomain sharing) |
| `COOKIE_PATH` | No | `/` | Path scope access token |
| `REFRESH_COOKIE_PATH` | No | `/api/auth/refresh` | Path scope refresh token (dibatasi ke endpoint refresh) |

## Variabel ImageKit

| Variabel | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `IMAGEKIT_PUBLIC_KEY` | Yes | - | Public key dari ImageKit dashboard |
| `IMAGEKIT_PRIVATE_KEY` | Yes | - | Private key dari ImageKit dashboard |
| `IMAGEKIT_URL_ENDPOINT` | Yes | - | URL endpoint ImageKit (contoh: `https://ik.imagekit.io/your_id`) |

### Cara Mendapatkan Key ImageKit

1. Buat akun di [imagekit.io](https://imagekit.io)
2. Buka Dashboard → Developer → API Keys
3. Salin `Public Key` dan `Private Key`
4. Salin `URL Endpoint` dari bagian General Settings

## Variabel CORS

| Variabel | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `CORS_ORIGINS` | No | dev: reflect semua, prod: nonaktif | Comma-separated allowed origins |

### Contoh

```bash
# Hanya izinkan localhost dan satu domain production
CORS_ORIGINS=http://localhost:3000,https://mysite.com

# Dev mode — reflect semua origin (tidak aman untuk production)
CORS_ORIGINS=
```

> **Catatan:** Tanpa `CORS_ORIGINS`, dev (`NODE_ENV != production`) mereflect semua origin; production menonaktifkan CORS (origin `false`). Di production selalu set daftar domain spesifik.

## Variabel Bulk Upload

| Variabel | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `BULK_UPLOAD_KEY` | Tidak* | - | API key header `x-api-key` untuk `POST /api/products/bulk`. Bila kosong → endpoint menolak semua request (401) |

> **Catatan:** `BULK_UPLOAD_KEY` wajib diisi bila ingin memakai endpoint bulk. Fail-closed: tidak ter-set = endpoint terkunci.

## Variabel Server

| Variabel | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `TRUST_PROXY` | No | `false` | Aktifkan jika di belakang reverse proxy (Vercel, nginx). Membaca IP client asli untuk rate limit dan logging |

> **Catatan:** Jangan set `TRUST_PROXY=true` di local development tanpa proxy. Akan salah baca IP.

## Contoh File `.env` Lengkap

```bash
# === Application ===
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# === Database ===
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=rahasia123
DATABASE_NAME=skripsi_db

# === Authentication ===
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
COOKIE_SECRET=z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1

# === Cookie Configuration ===
COOKIE_SAMESITE=lax
COOKIE_SECURE=false
COOKIE_PATH=/
REFRESH_COOKIE_PATH=/api/auth/refresh

# === ImageKit ===
IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxxxxxxxxx
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxxxxxxxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/abc123def456

# === CORS ===
CORS_ORIGINS=http://localhost:3000,https://mysite.com

# === Bulk Upload ===
BULK_UPLOAD_KEY=your_bulk_upload_key

# === Server ===
TRUST_PROXY=true
```

## Troubleshooting

### "Invalid environment variables" saat startup

Aplikasi melakukan validasi manual di `src/config/env.ts` saat pertama kali dijalankan. Pastikan:

1. Semua variabel required sudah diisi
2. `PORT` dan `DATABASE_PORT` berupa angka
3. `NODE_ENV` hanya bernilai `development`, `production`, atau `test`

### Koneksi database gagal

- Pastikan container MariaDB sudah berjalan: `docker compose up -d`
- Pastikan `DATABASE_HOST` = `localhost` (bukan `127.0.0.1` jika pakai Docker)
- Cek log MariaDB: `docker compose logs database`

### ImageKit upload gagal

- Pastikan semua `IMAGEKIT_*` variabel sudah terisi dengan benar
- Cek apakah key masih aktif di ImageKit dashboard
