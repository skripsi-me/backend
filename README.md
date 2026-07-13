# Backend E-Commerce API

Backend API untuk aplikasi e-commerce yang dibangun dengan Fastify 5, Drizzle ORM, dan MariaDB.

## Spesifikasi Teknis

| Komponen | Teknologi |
|----------|-----------|
| Framework | Fastify 5 (Node.js ESM) |
| Database | MariaDB LTS (via Docker) |
| ORM | Drizzle ORM (MySQL dialect) |
| Validasi | TypeBox (AJV) |
| Autentikasi | JWT + HttpOnly Cookies (Signed) |
| ID | ULID (26 karakter) |
| Media | ImageKit.io SDK |
| Rate Limit | 20 request/detik per IP |
| API Docs | Swagger UI (`/docs`) |

## Format Response Standar

Semua response API mengikuti format konsisten:

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {},
  "error": {}
}
```

- `data` berisi hasil operasi (hanya ada saat sukses)
- `error` berisi error per field (hanya ada saat error validasi)

## Endpoint API

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/register` | Public | Registrasi akun baru |
| POST | `/login` | Public | Login, mengatur cookie JWT |
| POST | `/refresh` | Public | Refresh access token |
| POST | `/logout` | Public | Logout, menghapus cookie |
| POST | `/change-password` | Authenticated | Ubah password |

### Users (`/api/users`)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/me` | Authenticated | Lihat profil sendiri |
| PATCH | `/me` | Authenticated | Update profil sendiri |
| GET | `/` | Admin | List semua user |
| GET | `/:id` | Admin | Lihat detail user |
| POST | `/` | Admin | Buat user baru |
| PATCH | `/:id` | Admin | Update user |
| DELETE | `/:id` | Admin | Hapus user |

### Categories (`/api/categories`)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/` | Public | List semua kategori |
| GET | `/:slug` | Public | Detail kategori berdasarkan slug |
| POST | `/` | Admin | Buat kategori baru (slug otomatis) |
| PATCH | `/:id` | Admin | Update kategori |
| DELETE | `/:id` | Admin | Hapus kategori |

### Products (`/api/products`)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/` | Public | List produk (paginated, search, filter) |
| GET | `/best-sellers` | Public | Produk terlaris |
| GET | `/slug/:slug` | Public | Detail produk berdasarkan slug |
| GET | `/category/:categorySlug` | Public | List produk per kategori |
| GET | `/:id` | Admin | Detail produk berdasarkan ID |
| POST | `/` | Admin | Buat produk baru (slug otomatis) |
| PATCH | `/:id` | Admin | Update produk |
| DELETE | `/:id` | Admin | Hapus produk |

### Carts (`/api/carts`)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/` | Authenticated | Lihat keranjang |
| POST | `/items` | Authenticated | Tambah item ke keranjang |
| PUT | `/items/:itemId` | Authenticated | Update jumlah item |
| DELETE | `/items/:itemId` | Authenticated | Hapus item dari keranjang |

### Orders (`/api/orders`)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/` | Authenticated | Checkout (buat pesanan dari keranjang) |
| GET | `/me` | Authenticated | List pesanan sendiri |
| GET | `/:id` | Authenticated | Detail pesanan |
| GET | `/` | Admin | List semua pesanan |
| GET | `/report` | Admin | Laporan pesanan |
| PATCH | `/:id/status` | Admin | Update status pesanan |

### Health Check

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/health` | Public | Cek status server |

## Setup Development

### Prasyarat

- Node.js 20+
- pnpm
- Docker & Docker Compose

### Instalasi

```bash
# 1. Clone repository
git clone <url>
cd backend

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env
# Edit .env sesuai kebutuhan (lihat docs/ENVIRONMENT.md)

# 4. Jalankan MariaDB
docker compose up -d

# 5. Sinkronisasi schema ke database
npx drizzle-kit push

# 6. Setup FULLTEXT index (untuk pencarian produk)
node scripts/setup-fulltext.js

# 7. Jalankan development server
npm run dev
```

Server akan berjalan di `http://localhost:3000`. Swagger UI tersedia di `http://localhost:3000/docs`.

### Commands

| Command | Deskripsi |
|---------|-----------|
| `npm run dev` | Development server dengan hot reload |
| `npm run build` | Compile TypeScript ke `dist/` |
| `npm run start` | Jalankan production build |
| `npm test` | Jalankan integration test |
| `npm run lint:fix` | Format code dengan ESLint + Prettier |
| `npx drizzle-kit push` | Sinkronisasi schema ke database |

### Testing

```bash
# Jalankan semua test
npm test

# Jalankan test modul tertentu
npx vitest src/modules/products/tests/products.test.ts
```

> **Catatan:** Test membutuhkan MariaDB yang berjalan. Test menggunakan `app.inject()` (bukan HTTP request nyata) dan membersihkan data test secara otomatis.

## Produksi

### Build & Jalankan

```bash
# Build
npm run build

# Jalankan
npm run start
```

### Deploy ke VPS/Server

1. Install Node.js 20+ dan MariaDB di server
2. Clone repository dan install dependencies
3. Setup `.env` dengan konfigurasi production
4. Jalankan MariaDB dan sinkronisasi schema
5. Gunakan PM2 atau systemd untuk process manager:

```bash
# Contoh dengan PM2
npm run build
pm2 start dist/src/server.js --name "ecommerce-api"
pm2 save
```

Pastikan environment variables di production sudah dikonfigurasi dengan benar (lihat `docs/ENVIRONMENT.md`).

## Dokumentasi Lainnya

- `docs/API_REFERENCE.md` — Referensi API lengkap untuk frontend
- `docs/ARCHITECTURE.md` — Arsitektur dan desain sistem
- `docs/ENVIRONMENT.md` — Konfigurasi environment variables
- `docs/RESPONSE.md` — Contoh request/response API
- `docs/SECURITY.md` — Kebijakan keamanan
- `http://localhost:3000/docs` — Swagger UI (otomatis)

## Konvensi Git

Proyek ini menggunakan **Conventional Commits**:

| Prefix | Keterangan |
|--------|------------|
| `feat:` | Fitur baru |
| `fix:` | Perbaikan bug |
| `docs:` | Perubahan dokumentasi |
| `style:` | Format kode |
| `refactor:` | Refaktor kode |
| `test:` | Penambahan/pembaruan test |
| `chore:` | Tugas pemeliharaan |
