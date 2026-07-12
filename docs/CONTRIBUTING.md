# Panduan Kontribusi

Dokumentasi ini menjelaskan workflow dan konvensi yang digunakan dalam pengembangan backend e-commerce.

## Prasyarat

- Node.js 20+
- pnpm
- Docker & Docker Compose
- Git

## Setup Development

```bash
# Clone repository
git clone <url>
cd backend

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env sesuai kebutuhan

# Jalankan MariaDB
docker compose up -d

# Sinkronisasi schema
npx drizzle-kit push

# Setup FULLTEXT index
node scripts/setup-fulltext.js

# Jalankan dev server
npm run dev
```

## Branching Strategy

Menggunakan Git Flow:

| Branch | Fungsi | Contoh |
|--------|--------|--------|
| `main` | Branch produksi, stabil | - |
| `develop` | Branch pengembangan utama | - |
| `feature/<nama>` | Fitur baru | `feature/add-wishlist` |
| `fix/<nama>` | Perbaikan bug | `fix/cart-quantity-overflow` |
| `chore/<nama>` | Tugas pemeliharaan | `chore/update-deps` |

### Alur Kerja

1. Buat branch dari `develop`:
   ```bash
   git checkout develop
   git checkout -b feature/nama-fitur
   ```

2. Kerjakan perubahan, commit dengan konvensi di bawah

3. Push branch:
   ```bash
   git push origin feature/nama-fitur
   ```

4. Buat Pull Request ke `develop`

5. Setelah merge, hapus branch:
   ```bash
   git branch -d feature/nama-fitur
   ```

## Conventional Commits

Format commit:

```
<type>(<scope>): <deskripsi>

[optional body]
```

### Type

| Type | Keterangan | Contoh |
|------|------------|--------|
| `feat` | Fitur baru | `feat(auth): add forgot password endpoint` |
| `fix` | Perbaikan bug | `fix(orders): prevent empty cart checkout` |
| `docs` | Dokumentasi | `docs: update API response examples` |
| `style` | Format kode | `style: fix eslint warnings` |
| `refactor` | Refaktor | `refactor(products): extract search logic` |
| `test` | Test | `test(carts): add edge case tests` |
| `chore` | Pemeliharaan | `chore: update dependencies` |

### Scope

Scope opsional, menunjukkan modul yang terpengaruh:

- `auth`, `users`, `categories`, `products`, `carts`, `orders`
- `api` (untuk perubahan lintas modul)
- `db` (untuk perubahan schema)

## Code Style

### TypeScript

- **ESM only** — Gunakan `import/export`, bukan `require`
- **Import extension** — Selalu tambahkan `.js` extension:
  ```typescript
  import { db } from '../../config/database.js';
  ```
- **Type imports** — Gunakan `import type` untuk type-only imports:
  ```typescript
  import type { FastifyRequest } from 'fastify';
  ```
- **Strict mode** — TypeScript strict, no `any` kecuali sangat perlu

### Naming Convention

| Item | Format | Contoh |
|------|--------|--------|
| File | `kebab-case` | `auth.service.ts` |
| Class | `PascalCase` | `AuthService` |
| Function | `camelCase` | `getById()` |
| Variable | `camelCase` | `totalAmount` |
| DB Column | `snake_case` | `total_amount` |
| API Response Key | `snake_case` | `total_amount` |

### Module Pattern

Setiap modul di `src/modules/<name>/`:

```
<name>.schema.ts    — TypeBox validation schemas
<name>.service.ts   — Database queries via Drizzle
<name>.controller.ts — Request handlers
<name>.routes.ts    — Fastify route registration
tests/<name>.test.ts — Integration tests
```

## Testing

### Menjalankan Test

```bash
# Semua test
npm test

# Test tertentu
npx vitest src/modules/products/tests/products.test.ts

# Watch mode
npx vitest --watch
```

### Menulis Test

- Test file di `src/modules/<name>/tests/<name>.test.ts`
- Menggunakan `app.inject()` (bukan HTTP nyata)
- Setup data test di `beforeAll`
- Cleanup data test di `afterAll`
- Login via `app.inject()` untuk dapat cookie auth

### Contoh Struktur Test

```typescript
import { buildApp } from '../../../app.js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Module Name', () => {
  let app: any;
  let authToken: string;

  beforeAll(async () => {
    app = await buildApp();
    // Setup test data
    // Login untuk dapat token
  });

  afterAll(async () => {
    // Cleanup test data
    await app.close();
  });

  it('should do something', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/endpoint',
      cookies: { token: authToken },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.metadata.code).toBe(200);
  });
});
```

## Database

### Menambah Kolom

1. Edit `src/db/schema.ts`
2. Jalankan `npx drizzle-kit push`
3. Update service jika ada perubahan query

### Menambah Tabel

1. Definisikan tabel di `src/db/schema.ts`
2. Definisikan relasi
3. Jalankan `npx drizzle-kit push`
4. Buat module baru di `src/modules/`

## Checklist Sebelum Commit

- [ ] Code sudah di-lint (`npm run lint:fix`)
- [ ] Test masih berjalan (`npm test`)
- [ ] Tidak ada `console.log` yang tertinggal
- [ ] Import menggunakan `.js` extension
- [ ] Type imports menggunakan `import type`
- [ ] Commit message mengikuti Conventional Commits
