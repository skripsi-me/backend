# Kebijakan Keamanan

Dokumentasi ini menjelaskan langkah-langkah keamanan yang diterapkan pada backend e-commerce.

## Versi yang Didukung

Hanya versi terbaru (`main` branch) yang menerima update keamanan.

## Langkah Keamanan

### Autentikasi

- **JWT HttpOnly Cookies** — Token tidak dapat diakses oleh JavaScript (mencegah XSS)
- **Signed Cookies** — Cookie ditandatangani dengan `COOKIE_SECRET` (mencegah manipulasi)
- **Refresh Token Rotation** — Refresh token di-rotate setiap kali digunakan. Token lama otomatis invalid.
- **Refresh Token Hash** — Refresh token disimpan sebagai SHA-256 hash di `users.refresh_token_hash`. Reuse token lama → 401 + log.
- **bcrypt** — Password di-hash dengan 10 salt rounds

### Otorisasi

- **Role-based access** — Dua role: `user` dan `admin`
- **Guard `authenticate`** — Memverifikasi JWT sebelum akses resource. Jika gagal, langsung return 401 dan menghentikan request (tidak lanjut ke handler).
- **Guard `adminOnly`** — Memverifikasi role `admin` sebelum akses resource administratif. Memastikan `authenticate` berhasil sebelum cek role.
- **Register admin** — Hanya pengguna dengan role `admin` yang sudah login yang dapat membuat akun admin baru

### Infrastruktur

- **Rate Limiting** — Register: 3/menit, Login: 5/menit, Refresh: 10/menit, Global: 100/menit
- **Helmet** — Security headers (CSP, HSTS, dll)
- **CORS** — Cross-Origin Resource Sharing dikonfigurasi
- **MariaDB** — Hanya bind ke `127.0.0.1` (tidak exposed ke luar)
- **Multipart Limits** — Upload file dibatasi 5MB, hanya tipe gambar `image/jpeg`, `image/png`, `image/webp`, `image/gif`

### Data

- **Validasi Input** — Semua request divalidasi menggunakan TypeBox
- **Input Sanitization** — User input di-sanitize (strip HTML tags) sebelum disimpan ke DB (name, description, address)
- **Validasi Stok** — Sistem memeriksa ketersediaan stok saat checkout di dalam transaction. Jika stok tidak mencukupi, transaction di-rollback.
- **ULID** — ID bersifat non-sequential dan tidak mudah ditebak
- **Environment Variables** — Secret keys tidak di-hardcode

## Known Limitations

- Cookie-based auth tidak mendukung perangkat mobile native (perlu adaptasi Bearer token)
- Swagger UI menampilkan `bearerAuth` sebagai opsi, namun implementasi hanya mendukung cookie-based auth
- CSRF protection mengandalkan `sameSite: 'lax'` (default) atau `strict` — belum ada double-submit cookie
- Rate limiting menggunakan in-memory store (tidak distributed)
- Tidak ada brute-force protection pada login endpoint

## Update Keamanan

Update keamanan akan di-commit langsung ke `main` branch. Pastikan selalu menggunakan versi terbaru.
