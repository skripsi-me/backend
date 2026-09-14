# Plan 003 — Cleanup Over-Engineering Round 2

> Status: IN_PROGRESS — dieksekusi orkestrator.
> Eksekutor: orkestrator (lihat `docs/plans/README.md`).

---

## Goals

Lanjutan pembersihan over-engineering (non-correctness, tanpa ubah behavior API). Sasaran:

1. **Hapus kode mati** — 7 blok `*Relations` + import di `schema.ts` (tak ada `db.query` di src/tests), `clearCart` di `carts.service.ts` (tak dipanggil).
2. **Kolaps `updateProfile`** — `user.service.updateProfile` murni delegasi ke `update`; controller panggil `update` langsung.
3. **Dedupe validasi produk** — blok price/stock/category di `products.controller.create` duplikat `update`.
4. **Dedupe issue session** — `auth.controller.login` & `refreshToken` duplikat jwtSign+setCookie.

**Non-goals:** tanpa tambah dependency, tanpa ubah contract API (path/method/body/response wrapper/status/message), tanpa perbaikan security/correctness (deferred plan 001 tetap terbuka: `sanitize()`, `changePassword` invalidation, price type drift). Dedupe `findByEmail` lintas auth/users di-skip (precedent plan 001).

## Aturan Eksekusi

- Tidak menambah dependency. Satu commit per langkah.
- Jangan ubah contract response/status/message string.
- `ponytail:` di potongan berbatas yang menunda ceiling + jalur upgrade.
- Konvensi repo: import `.js` extension, `import type` inline.

## Langkah

### 1. Hapus kode mati
- `src/db/schema.ts`: hapus `import { relations }` + 7 blok `*Relations`.
- `src/modules/carts/carts.service.ts`: hapus `clearCart`.

**Uji:** `pnpm typecheck`, `pnpm lint`, `pnpm test` hijau.

### 2. Kolaps `updateProfile` → `update` (users)
- `user.service.ts`: hapus metode `updateProfile`.
- `user.controller.ts:updateProfile` → `this.userService.update(request.user.id, request.body)` (`UpdateProfileBody` ⊆ `UpdateUserBody`).

**Uji:** `pnpm typecheck`, `pnpm lint`, test users.

### 3. Dedupe validasi produk (controller)
- Ekstrak helper module-scope `validateAndCoercePriceStock(body)` → `{ price?, stock? } | null`; reuse di `create` & `update`. Message 400 identik.

**Uji:** `pnpm typecheck`, `pnpm lint`, test products.

### 4. Dedupe issue session (auth)
- Ekstrak private `issueSession(reply, user)` di `auth.controller` (sign access+refresh, `updateRefreshToken`, set 2 cookie) — pakai di `login` & `refreshToken`.

**Uji:** `pnpm typecheck`, `pnpm lint`, test auth.

## Langkah Uji (final)

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test` (butuh MariaDB jalan)
4. Smoke: register → login → refresh → produk POST/PATCH → cart → checkout → order

## Rollback

Satu commit per langkah → `git revert <commit>` per langkah. Tanpa migrasi schema.

## Hasil Eksekusi (orkestrator)

- **Catatan:** MariaDB/Docker tidak tersedia di WSL distro saat eksekusi → `pnpm test` (Uji langkah 1-4) di-SKIP. Validasi via `pnpm typecheck` + `pnpm lint` per langkah. Test wajib dijalankan ulang bila DB tersedia.

## Referensi Orkestrator

- Aturan global, validasi, mode, daftar plan + status: `docs/plans/README.md`.