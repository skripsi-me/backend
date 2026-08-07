# 001 — CORS Origin Allowlist

**Status**: done
**Prioritas**: tinggi
**Terkait**: Temuan #1 — CORS `origin: true` reflect semua origin

---

## Goal

Ganti konfigurasi CORS `origin: true` (reflect semua origin) dengan allowlist yang dikontrol melalui environment variable. Production hanya terima request dari origin terdaftar.

---

## Konteks

- **File**: `src/plugins/security.plugin.ts:14-22`
- **Masalah**: `origin: true` merefleksikan `Origin` header dari request apapun ke `Access-Control-Allow-Origin`. Dengan cookie auth + `credentials: true`, ini memungkinkan cross-origin request dari domain manapun untuk mengakses endpoint yang pakai cookie.
- **Risk**: CSRF-like risk jika `SameSite` diubah ke `none` di masa depan. Reflected origin juga bypass CSP.

---

## Langkah Eksekusi

### 1. Tambah env `CORS_ORIGINS` ke `src/config/env.ts`

```typescript
// Setelah IMAGEKIT_URL_ENDPOINT
const CORS_ORIGINS = optionalEnv('CORS_ORIGINS'); // comma-separated, e.g. "http://localhost:3000,https://mysite.com"
```

Tambahkan ke object `env`:

```typescript
CORS_ORIGINS,
```

### 2. Update `src/plugins/security.plugin.ts`

Ganti:

```typescript
origin: true,
```

Dengan:

```typescript
origin: env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map(o => o.trim())
  : true,
```

Import `env` dari `src/config/env.js` di file ini.

### 3. Update `.env.example`

Tambahkan:

```bash
# === CORS ===
# Comma-separated allowed origins (kosongkan untuk reflect semua di dev)
# Contoh: http://localhost:3000,https://mysite.com
CORS_ORIGINS=
```

### 4. Update `docs/ENVIRONMENT.md`

Tambahkan field `CORS_ORIGINS` ke tabel environment variables.

---

## Definition of Done

- [x] `CORS_ORIGINS` terdefinisi di `env.ts`
- [x] `security.plugin.ts` pakai allowlist saat env diset
- [x] Dev tanpa `CORS_ORIGINS` → tetap `origin: true` (backward compatible)
- [x] `.env.example` punya template
- [x] `npm run dev` jalan normal
- [x] `npm run build` tanpa error

---

## Verifikasi

```bash
# 1. Tanpa CORS_ORIGINS (dev mode)
curl -I -X OPTIONS http://localhost:3000/health \
  -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: GET"
# Harus: Access-Control-Allow-Origin: http://evil.com (dev mode)

# 2. Dengan CORS_ORIGINS
echo 'CORS_ORIGINS=http://localhost:3000,https://mysite.com' >> .env
npm run dev
curl -I -X OPTIONS http://localhost:3000/health \
  -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: GET"
# Harus: TIDAK ADA Access-Control-Allow-Origin (evil.com ditolak)

curl -I -X OPTIONS http://localhost:3000/health \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"
# Harus: Access-Control-Allow-Origin: http://localhost:3000 (diizinkan)

# 3. Build
npm run build
```

---

## Risiko / Catatan

- **Breaking**: Semua frontend di production harus menambahkan origin mereka ke `CORS_ORIGINS` di environment variables backend.
- **Dev experience**: Tanpa `CORS_ORIGINS`, tetap `origin: true` — tidak mengganggu workflow development.
- **Vercel**: Set `CORS_ORIGINS` di Vercel dashboard → Environment Variables.
