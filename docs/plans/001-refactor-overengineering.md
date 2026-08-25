# Plan 001 — Refactor Over-Engineering + Code Smell

> Status: DONE — dieksekusi orkestrator. 7 commit refactor + 1 commit smell.
> Eksekutor: orkestrator (lihat `docs/plans/README.md`).

---

## Goals

Bersihkan kompleksitas tanpa mengubah perilaku API (tidak ada perubahan contract response/status code). Tiga sasaran:

1. **Hapus kode mati** — debug script, dev util, CI mati, re-export tak terpakai, helper tak terpakai.
2. **Konsolidasi duplikasi** — select produk (5×), generateSlug (2×), updateProfile/update, schema body, query pagination, deteksi TiDB.
3. **Perbaiki smell keamanan/konsistensi** — sanitize, price type drift, refresh-token invalidation, CORS, kontrol-flow via string.

**Non-goals:** tidak menambah dependency, tidak refactor arsitektur, tidak ubah format response, tidak ubah route/schema contract. Bug/perf di luar scope (laporkan, jangan perbaiki).

---

## Aturan Eksekusi (wajib)

- **Tidak menambah dependency** baru. `fastify`, `drizzle`, `typebox`, `bcrypt`, `imagekit` sudah cukup.
- **Satu commit per langkah** — reviewable. Berhenti jika satu langkah gagal uji.
- **Jangan ubah contract API** (path, method, body, response wrapper, status code, message string yang dipakai frontend).
- Tanpa komentar baru (kecuali `ponytail:` untuk potongan berbatas).
- Konvensi repo: import `.js` extension, `import type` inline, Drizzle column mapping `camelCase` TS → `snake_case` DB.

---

## Langkah

### 1. Hapus kode mati
- `delete debug-tmp.ts`
- `delete drop-tables.ts`
- `delete .github/workflows/ci.yml` (seluruh file dikomentari)
- `delete src/db/index.ts` (re-export tak diimpor siapa pun; semua pakai `db/schema.js`)
- `delete createPaginatedResponseSchema` di `pagination.schema.ts` (tak dipakai)

**Uji:** `pnpm typecheck`, `pnpm lint`, `pnpm test` hijau.

### 2. Konsolidasi select produk
- Buat satu helper `selectProductColumns` (objek kolom Drizzle) di `products.service.ts`.
- Pakai di `getBestSellers`, `list`, `getById`, `getBySlug`, `listByCategorySlug`. Map via `mapProductRow` yang sudah ada.
- `getBestSellers` tetap tambah `total_sold` setelahnya.

**Uji:** jalankan test products + hit GET `/api/products`, `/api/products/slug/:slug`, `/api/products/best-sellers` manual.

### 3. Ekstrak `generateSlug` bersama
- Pindah ke `src/shared/utils/slug.util.ts` (ambil `existing` list via callback `findExisting(slugPrefix)` agar reusable lintas tabel).
- `products.service` (truncate 100 + strip trailing `-`) dan `categories.service` (tanpa truncate) pakai helper; beda panjang slug di-handle caller.

**Uji:** test products + categories; buat nama duplikat cek suffix `-1`.

### 4. Merge `updateProfile` → `update` (users)
- `updateProfile(id, body)` = `update(id, body)` karena body `UpdateProfileBody` ⊆ `UpdateUserBody` (hanya name/address/phone). Buang duplikasi.
- Pertahankan guard "no-op jika object kosong".

**Uji:** test users; PATCH `/api/users/me`.

### 5. Kolaps deteksi TiDB
- Simpan `isTiDB`/`ssl` sekali saja di `config/database.ts` + `drizzle.config.ts`. Dua salinan tersisa; biarkan jika orkestrator menilai duplikasi 1 baris tak layak refactor. *(ponytail: duplikasi 1 baris `isTiDB` — biarkan, refactor saat DB backend diverdifikasi ≥2.)*

**Uji:** `pnpm typecheck`; app boot dengan env MariaDB lokal.

### 6. Reuse schema pagination + body
- `GetBestSellersSchema.query` = `Type.Composite([PaginationQuerySchema, Type.Object({...})])` — buang redefinisi page/limit.
- `RegisterSchema.body` = `CreateUserSchema.body` (impor dari `users/user.schema.js`). Hapus duplikasi.

**Uji:** `pnpm typecheck`, `pnpm test`.

### 7. Ganti kontrol-flow string
- Di `carts.controller` & `products.controller`, ganti `if (err.message === '...')` dengan error class ringan (`CartItemNotFoundError`, `CategoryNotFoundError`, dst) di service layer — satu file `src/shared/utils/errors.ts`. Kontrol-flow lewat `instanceof`, bukan string.
- Biarkan pesan bahasa Indonesia tetap sama (contract).

**Uji:** test carts + products; pastikan 404 tetap 404.

### 8. Smell keamanan/konsistensi (opsional, terpisah)
- **Hapus `sanitize()`** — regex strip-XSS tidak efektif; andalkan helmet. Bersihkan import di 4 service + test sanitize. *(keputusan orkestrator: bisa tunda jika khawatir)*
- **`changePassword`** — bersihkan `refreshTokenHash` + `refreshTokenHashPrev` setelah ganti password. `ponytail:` menyapu semua sesi user sekaligus; token-per-device butuh tabel sesi.
- **CORS** — jika `CORS_ORIGINS` kosong di production, tolak (`origin: false`) bukan reflect-all. Refactor `security.plugin.ts`.
- **price type drift** — selaraskan schema `price: Type.Number` dengan nilai string aktual; laporkan, jangan ubah serialisasi sendirian tanpa ok orkestrator (bisa pecah contract).
- **validation regex table** — biarkan (berfungsi); tandai `ponytail:` brittleness.
- **swagger bearerAuth vs cookie** — perbaiki deskripsi schema/security scheme di `swagger.plugin.ts` + routes.

---

## Langkah Uji (final)

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test` (butuh MariaDB jalan)
4. Smoke manual: register → login → GET/POST/PATCH produk (multipart + json) → cart → checkout → order status → users/me.

## Rollback

- Setiap langkah commit terpisah → `git revert <commit>` per langkah.
- Simpan output `drizzle`/schema tidak berubah (tidak ada migrasi).

## Hasil Eksekusi (orkestrator)

- **Selesai:** step 1–8. Uji hijau: typecheck, lint (0 error), test 55/55.
- **Deferred (dilaporkan, tidak diubah):**
  - `sanitize()` + `changePassword` refresh-token invalidation — menyentuh `auth.service.ts` yang berisi WIP user (rotasi refresh-token). Jangan dibundle; eksekusi setelah WIP di-commit.
  - Price type drift (`price` string vs schema `Type.Number`), validation regex table — dilaporkan, butuh keputusan contract.
- **Bug dilaporkan (di luar scope):** FULLTEXT InnoDB/MariaDB tidak mengindeks row baru sampai `OPTIMIZE TABLE` → produk baru tidak muncul di pencarian `?search=` sampai flush cache. Butuh strategi search lain / OPTIMIZE terjadwal.
- **Catatan DB:** dev DB disinkronkan manual dengan schema (kolom `refresh_token_hash_prev` + index; drop `refresh_token`).

## Referensi Orkestrator

- Aturan global, validasi, mode, daftar plan + status: `docs/plans/README.md`.