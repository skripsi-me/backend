# Plan 013 — Sinkronisasi Dokumentasi dengan Kode

## Status

**Status**: done
**Prioritas**: tinggi

## Masalah

Audit docs vs code menemukan banyak drift:

- 4 file API tumpang-tindih (`API.md`, `API_REFERENCE.md`, `docs/RESPONSE.md`, `RESPONSE.md`) dengan isi saling kontradiksi.
- Claim error/status code palsu di docs (409 register/update, `Old password is incorrect`, cart stock validation, dsb).
- Default limit best-sellers & pagination salah (5/10 vs 20/1000).
- Orders list digambarkan array polos (realita paginated).
- README rate limit salah ("20 request/detik" vs 100/menit).
- ENVIRONMENT.md bilang validasi TypeBox (sudah manual) + missing 5 cookie vars.
- AGENTS.md bilang `pnpm-lock.yaml` di-gitignore (padahal tracked).
- opencode.jsonc rujuk file docs yang tak ada.

## Eksekusi

1. **Konsolidasi API docs** → `docs/API.md` jadi canonical, hapus `API_REFERENCE.md`, `docs/RESPONSE.md`, `RESPONSE.md`. Update referensi di README, plans/README, opencode.jsonc.
2. **Fix inaccuracies API.md**: hapus 409 register/update/kategori/produk (tak diimplementasi; duplicate key → 500), fix pesan change-password (400 `Invalid old password`), cart error rows (tak ada validasi stok/produk), best-sellers default 20 + param `page`, order report default bulan berjalan, stock message checkout, orders status enum error, hapus 404 palsu pada DELETE & status update.
3. **README**: rate limit 100/menit global + per-endpoint auth.
4. **ENVIRONMENT.md**: validasi manual (bukan TypeBox), tambah cookie vars.
5. **DEPLOYMENT.md**: env table lengkap, fix typo `npm run run build`.
6. **ARCHITECTURE.md**: ER tambah `refresh_token_hash`, fix default limit.
7. **SECURITY.md**: sameSite default `lax`, tambah refresh-hash + mime whitelist.
8. **AGENTS.md**: lockfile tracked.
9. **opencode.jsonc**: hapus/arahkan broken instructions refs ke `docs/API.md` + `src/db/schema.ts`.

## DoD

- [x] Hanya satu file API reference (`docs/API.md`), tersisa & konsisten.
- [x] Tidak ada claim error/status yang bertentangan dengan kode.
- [x] README/ENVIRONMENT/DEPLOYMENT/ARCHITECTURE/SECURITY/AGENTS sinkron dgn kode.
- [x] opencode.jsonc tidak rujuk file yang tak ada.
- [x] Referensi silang antar docs valid.

## Catatan

- CI (`.github/workflows/ci.yml`) ternyata 100% komentar → mati. Ditangani plan 014.
- `docker-compose.yml` punya latent bug `MYSQL_USER=root` pada fresh volume init. Ditangani plan 014.
