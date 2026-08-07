# 004 — trustProxy

**Status**: done
**Prioritas**: sedang
**Terkait**: Temuan #4 — trustProxy tidak diset

---

## Goal

Aktifkan `trustProxy` di Fastify agar IP address yang terbaca adalah IP client asli, bukan IP proxy (Vercel, nginx, load balancer).

---

## Konteks

- **File**: `src/app.ts` — Fastify({}) options (~line 24)
- **Masalah**: Tanpa `trustProxy`, `req.ip` selalu IP proxy/localhost. Rate limit jadi applied ke semua user dengan IP proxy yang sama. Log IP juga salah.
- **Solusi**: Set `trustProxy: true`. Fastify v5 mendukung ini natif.

---

## Langkah Eksekusi

### 1. Tambah env `TRUST_PROXY` ke `src/config/env.ts`

```typescript
const TRUST_PROXY = optionalEnv('TRUST_PROXY', 'false') === 'true';
```

Tambahkan ke object `env`:

```typescript
TRUST_PROXY,
```

### 2. Update `src/app.ts` — Fastify options

```typescript
const app = Fastify({
  logger: isProduction
    ? true
    : {
        transport: {
          target: 'pino-pretty',
        },
      },
  trustProxy: env.TRUST_PROXY,
}).withTypeProvider<TypeBoxTypeProvider>();
```

### 3. Update `.env.example`

```bash
# === Server ===
# Aktifkan jika di belakang reverse proxy (Vercel, nginx, Cloudflare)
# Membaca IP client asli untuk rate limit dan logging
TRUST_PROXY=false
```

### 4. Update `docs/ENVIRONMENT.md`

Tambahkan field `TRUST_PROXY` ke tabel.

---

## Definition of Done

- [x] `TRUST_PROXY` terdefinisi di `env.ts` (default false)
- [x] Fastify options pakai `trustProxy: env.TRUST_PROXY`
- [x] Dev tanpa `TRUST_PROXY` → tetap `false` (backward compatible)
- [x] `.env.example` punya template
- [x] `npm run dev` jalan normal
- [x] `npm run build` tanpa error

---

## Verifikasi

```bash
# 1. Build
npm run build

# 2. Dev
npm run dev

# 3. Cek logs — request IP harus IP asli client (bukan 127.0.0.1 saat lewat proxy)

# 4. Rate limit test
# Set TRUST_PROXY=false, akses dari proxy → semua user share 1 IP → limit cepat habis
# Set TRUST_PROXY=true → setiap user punya IP sendiri → limit fair
```

---

## Risiko / Catatan

- **Dev environment**: Jangan set `TRUST_PROXY=true` di local development tanpa proxy. Akan salah baca IP.
- **Vercel**: Set `TRUST_PROXY=true` di Vercel environment variables.
- **Performance**: Negligible — satu property di Fastify options.
