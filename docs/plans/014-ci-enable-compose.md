# Plan 014 — Aktifkan CI + Fix `MYSQL_USER=root`

## Status

**Status**: pending
**Prioritas**: tinggi

## Masalah

1. `.github/workflows/ci.yml` 100% komentar (55 baris `#`, 0 baris aktif) → CI mati. Plan 011 DoD "CI jalan di push ke main" tidak terpenuhi.
2. Draft CI menggunakan `MYSQL_USER: root` — ditolak image MariaDB entrypoint (`ERROR 1396: Operation CREATE USER failed for 'root'@'%'`, sudah diverifikasi dengan `mariadb:lts`). Fresh container → init gagal → service tidak healthy → job merah.
3. `docker-compose.yml` memakai `MYSQL_USER: ${DATABASE_USER}` dengan default `root` di `.env.example` → bug latent sama saat volume dihapus & di-init ulang.

## Eksekusi

- [ ] `ci.yml`: buka komentar, ganti service env jadi root-only (`MYSQL_ROOT_PASSWORD` + `MYSQL_DATABASE`), `DATABASE_USER=root`, `DATABASE_PASSWORD=root`.
- [ ] `docker-compose.yml`: ubah `MYSQL_USER`/`MYSQL_PASSWORD` agar tidak `root`, atau jatuh ke root-only (kompatibel fresh init).
- [ ] Best practice CI: `pnpm/action-setup` + `packageManager` field, SHA pinning actions, `permissions`, `concurrency`, `timeout-minutes`.
- [ ] Update plan 011 status & docs jika perlu.

## DoD

- [ ] CI hijau di GitHub Actions pada push/PR ke `main`.
- [ ] `docker compose up` dari fresh volume sukses.
- [ ] Dev workflow docs (CONTRIBUTING/README) menyebut CI aktif.
