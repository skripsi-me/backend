# 011 — Dev Workflow: Script Lint/Typecheck + CI

**Status**: done
**Prioritas**: rendah
**Terkait**: Temuan #11 — Tidak ada script lint, typecheck, dan CI workflow

---

## Goal

Tambah script `lint` (bukan `lint:fix`), `typecheck`, dan CI workflow sederhana untuk memastikan kode tetap bersih dan teruji.

---

## Konteks

- **File**: `package.json` — scripts
- **Masalah**: Hanya ada `lint:fix` (otomatis fix). Tidak ada `lint` yang hanya report. Tidak ada `typecheck`. Tidak ada CI workflow.

---

## Langkah Eksekusi

### 1. Tambah scripts ke `package.json`

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/src/server.js",
    "test": "vitest",
    "lint": "eslint \"src/**/*.ts\"",
    "lint:fix": "eslint \"src/**/*.ts\" --fix && prettier --write \"src/**/*.ts\"",
    "typecheck": "tsc --noEmit"
  }
}
```

### 2. Buat `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mariadb:
        image: mariadb:lts
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: skripsi_db
          MYSQL_USER: root
          MYSQL_PASSWORD: root
        ports:
          - 3306:3306
        options: >-
          --health-cmd="healthcheck.sh --connect --innodb_initialized"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Setup environment
        run: cp .env.example .env

      - name: Setup env vars for CI
        run: |
          echo "DATABASE_HOST=127.0.0.1" >> .env
          echo "DATABASE_PORT=3306" >> .env
          echo "DATABASE_USER=root" >> .env
          echo "DATABASE_PASSWORD=root" >> .env
          echo "DATABASE_NAME=skripsi_db" >> .env
          echo "JWT_SECRET=ci_test_secret_key_long_enough_for_jwt" >> .env
          echo "COOKIE_SECRET=ci_test_cookie_secret_key_long_enough" >> .env
          echo "IMAGEKIT_PUBLIC_KEY=ci_test" >> .env
          echo "IMAGEKIT_PRIVATE_KEY=ci_test" >> .env
          echo "IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/ci_test" >> .env

      - name: Sync database schema
        run: npx drizzle-kit push

      - name: Setup FULLTEXT index
        run: node scripts/setup-fulltext.js

      - name: Typecheck
        run: pnpm run typecheck

      - name: Lint
        run: pnpm run lint

      - name: Test
        run: pnpm test
```

### 3. Update `.gitignore`

Pastikan `.github` tidak di-ignore.

---

## Definition of Done

- [x] Script `lint` ada di `package.json`
- [x] Script `typecheck` ada di `package.json`
- [x] `.github/workflows/ci.yml` ada dan valid
- [ ] CI jalan di push ke main (perlu push ke GitHub)
- [x] `npm run lint` jalan tanpa error
- [x] `npm run typecheck` jalan tanpa error

---

## Verifikasi

```bash
# 1. Lint
npm run lint

# 2. Typecheck
npm run typecheck

# 3. Build
npm run build

# 4. Test
npm test

# 5. Push ke branch test
git checkout -b test/ci-setup
git add .
git commit -m "ci: add lint, typecheck scripts + GitHub Actions workflow"
git push origin test/ci-setup
# Cek GitHub Actions tab — workflow harus jalan
```

---

## Risiko / Catatan

- **MariaDB di CI**: Pakai GitHub Actions service container. Health check penting.
- **FULLTEXT index**: `setup-fulltext.js` harus jalan setelah schema sync. Jika tidak, product search test gagal.
- **Secrets**: `IMAGEKIT_*` di CI pakai dummy value. Test ImageKit di-mock oleh `tests/setup.ts`.
- **Branch protection**: Setelah CI jalan, bisa tambah branch protection rule di GitHub untuk require CI pass sebelum merge.
