# Kebijakan Keamanan

Dokumentasi ini menjelaskan langkah-langkah keamanan yang diterapkan pada backend e-commerce.

## Versi yang Didukung

Hanya versi terbaru (`main` branch) yang menerima update keamanan.

## Langkah Keamanan

### Autentikasi

- **JWT HttpOnly Cookies** — Token tidak dapat diakses oleh JavaScript (mencegah XSS)
- **Signed Cookies** — Cookie ditandatangani dengan `COOKIE_SECRET` (mencegah manipulasi)
- **Refresh Token** — Access token berlaku 15 menit, refresh token 7 hari
- ** bcrypt** — Password di-hash dengan 10 salt rounds

### Otorisasi

- **Role-based access** — Dua role: `user` dan `admin`
- **Guard `authenticate`** — Memverifikasi JWT sebelum akses resource
- **Guard `adminOnly`** — Memverifikasi role `admin` sebelum akses resource administratif

### Infrastruktur

- **Rate Limiting** — Maksimal 20 request/detik per IP
- **Helmet** — Security headers (CSP, HSTS, dll)
- **CORS** — Cross-Origin Resource Sharing dikonfigurasi
- **MariaDB** — Hanya bind ke `127.0.0.1` (tidak exposed ke luar)
- **Multipart Limits** — Upload file dibatasi 5MB

### Data

- **Validasi Input** — Semua request divalidasi menggunakan TypeBox
- **ULID** — ID bersifat non-sequential dan tidak mudah ditebak
- **Environment Variables** — Secret keys tidak di-hardcode

## Known Limitations

- Cookie-based auth tidak mendukung perangkat mobile native (perlu adaptasi Bearer token)
- CSRF protection mengandalkan `sameSite: 'strict'` (belum ada double-submit cookie)
- Rate limiting menggunakan in-memory store (tidak distributed)
- Tidak ada brute-force protection pada login endpoint

## Update Keamanan

Update keamanan akan di-commit langsung ke `main` branch. Pastikan selalu menggunakan versi terbaru.
