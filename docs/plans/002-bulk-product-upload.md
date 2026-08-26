# Plan 002 — Bulk Product Upload (public, API key)

> Status: DONE — dieksekusi orkestrator. Commit `f8e6c0c` (amend `fe5b0de`).
> Eksekutor: orkestrator (lihat `docs/plans/README.md`).

---

## Goals

Endpoint bulk create produk `POST /api/products/bulk` untuk script upload otomatis (TUI) tanpa login. Body JSON array (maks 100 item), key identik single POST/UPDATE (`name`, `description`, `price`, `stock`, `category_id`, `image_url`).

**Non-goals:** tanpa multipart/file per item; tanpa auth JWT; tidak mengubah contract endpoint single yang sudah ada.

## Aturan Eksekusi

- Tidak menambah dependency. Reuse `ProductsService.create()` (sanitize + slug + insert).
- `x-api-key` header statis (`BULK_UPLOAD_KEY` env) — endpoint public tapi tidak terbuka untuk siapa pun.
- Partial success: item valid diinsert, item gagal dilaporkan per-index.
- Satu commit per langkah (code+tests, lalu docs).

## Langkah

1. **env** — `BULK_UPLOAD_KEY` (optionalEnv, fail-closed bila kosong). `.env.example`, `.env`, `tests/setup.ts`.
2. **schema** — `BulkCreateProductsSchema` (body `Type.Array(CreateProductSchema.body, { maxItems: 100 })`, response 200 `Type.Array(BulkResultSchema)`), `BulkResultSchema = { index, status: success|error, product?, message? }`.
3. **service** — `createBulk(items)`: loop sequential, per item `categoryExists` → `create()`, catch → `{ index, status: 'error', message }`. `ponytail:` sequential O(n) insert; batch besar → pre-generate slug + batched insert.
4. **controller** — `createBulk` → `reply.status(200).success(results)`.
5. **route** — `POST /bulk`, `config.rateLimit: { max: 10, timeWindow: '1 minute' }`, `preHandler: [apiKeyGuard]`, tanpa `adminOnly`. `ponytail:` API key statis tunggal; per-client/key-rotation butuh tabel key.
6. **tests** — sukses 2 item; kategori invalid → per-item error + item lain terinsert; duplikat nama → slug `-1`; tanpa key → 401; key salah → 401.
7. **docs** — API.md + registry orkestrator.

## Langkah Uji

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test` — 60/60 hijau (5 test bulk baru)
4. Smoke: inject `POST /api/products/bulk` dgn `x-api-key` benar/salah.

## Rollback

`git revert f8e6c0c` (langkah code+tests) dan commit docs.

## Referensi Orkestrator

- Aturan global, validasi, mode, daftar plan + status: `docs/plans/README.md`.