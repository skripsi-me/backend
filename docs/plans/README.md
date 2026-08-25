# Orkestrator — Eksekutor Plan

Dokumen ini adalah orkestrator utama: aturan global, validasi plan, aturan penulisan plan, langkah uji, mode, dan daftar plan beserta status.

---

## Peran

Eksekutor tunggal semua plan di `docs/plans/`. Membaca plan → validasi → eksekusi langkah demi langkah → uji → update status. Tidak menjalankan kerja di luar plan yang tervalidasi.

## Mode

- **Ponytail (default):** paling malas yang benar. Sebelum tulis kode: (1) perlu ada? (YAGNI) (2) sudah ada di codebase? (3) stdlib? (4) platform? (5) dependency terpasang? (6) bisa satu baris? Ambil anak tangga pertama yang kuat.
- **Caveman:** komunikasi terse (subagent/komentar punya mode sendiri).
- Tingkat ponytail/caveman di-set per sesi; plan tidak menimpa.

## Aturan Global (selalu)

1. **Tidak menambah dependency** tanpa alasan tertulis di plan.
2. **Satu commit per langkah plan.** Gagal uji → berhenti, laporkan, jangan lanjut.
3. **Jangan ubah contract API**: path, method, body, response wrapper `{metadata, data, error?}`, status code, pesan error yang dipakai frontend.
4. Tanpa komentar baru kecuali `ponytail:` (nama ceiling + jalur upgrade).
5. Konvensi repo: import `.js`, `import type` inline, Drizzle `camelCase` TS → `snake_case` DB, `formatSuccess`/`formatError`.
6. Bug/perf di luar scope plan → laporkan ke pemilik, jangan perbaiki diam-diam.

## Validasi Plan (sebelum eksekusi)

- Format terpenuhi (lihat Aturan Penulisan).
- Setiap langkah punya **Uji** yang runnable.
- Non-goal eksplisit, tidak bertabrakan dengan plan lain.
- Tidak ada langkah spekulatif (YAGNI). Kalau ragu: tanyakan.

## Aturan Penulisan Plan

- Nama file: `{nomor}-{nama-plan}.md` (zero-padded 3 digit, kebab-case).
- Nomor urut: increment dari plan terakhir di daftar. Tidak ada yang dihapus → nomor tidak dipakai ulang.
- Wajib punya section: **Goals**, **Aturan Eksekusi**, **Langkah** (tiap langkah + `**Uji:**`), **Langkah Uji final**, **Rollback**, **Referensi Orkestrator**.
- Status plan: `DRAFT` → `READY` → `IN_PROGRESS` → `DONE` / `BLOCKED` (isi di baris `> Status:`).

## Langkah Uji (jalur hijau)

Urutan wajib di tiap akhir langkah:

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test` (butuh MariaDB jalan — `docker compose up -d` + `npx drizzle-kit push` dulu)
4. Smoke manual sesuai plan (register → login → CRUD → checkout → order → dsb).

Rollback: `git revert <commit-langkah>` — tiap langkah commit terpisah sehingga revert aman per langkah.

## Daftar Plan

| No | Plan | Status |
|---|---|---|
| 001 | Refactor over-engineering + code smell (kode mati, duplikasi, smell) | DONE |