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

Semua penamaan dalam proyek harus konsisten. Berikut konvensi lengkap:

#### TypeScript & Code

| Item | Format | Contoh |
|------|--------|--------|
| File | `kebab-case` | `auth.service.ts`, `response.util.ts` |
| Class | `PascalCase` | `AuthService`, `ProductsController` |
| Function / Method | `camelCase` | `getById()`, `createOrder()` |
| Variable / Property | `camelCase` | `totalAmount`, `userId` |
| Constant (global) | `SCREAMING_SNAKE_CASE` | `MAX_FILE_SIZE` |
| Type / Interface | `PascalCase` | `CreateUserBody`, `JwtPayload` |
| Enum Value | `PascalCase` | `OrderStatus.Pending` |

#### Database (MariaDB via Drizzle)

| Item | Format | Contoh |
|------|--------|--------|
| Table name | `snake_case` (plural) | `cart_items`, `order_items` |
| Column name | `snake_case` | `total_amount`, `created_at` |
| Primary key | `id` | `id` |
| Foreign key | `<referenced_table_singular>_id` | `user_id`, `product_id` |
| Index name | `<column>_idx` | `slug_idx`, `name_fulltext_idx` |

> **Catatan:** Drizzle ORM otomatis memetakan `camelCase` (TypeScript) ke `snake_case` (DB). Definisikan kolom di schema dengan `snake_case`:
> ```typescript
> export const users = mysqlTable('users', {
>   phoneNumber: varchar('phone_number', { length: 20 }),
>   createdAt: timestamp('created_at').defaultNow(),
> });
> ```

#### API

| Item | Format | Contoh |
|------|--------|--------|
| Route path | `kebab-case` | `/api/products/best-sellers` |
| Route param | `camelCase` | `/:itemId`, `/:categorySlug` |
| Request body field | `snake_case` | `category_id`, `phone_number` |
| Response key | `snake_case` | `total_amount`, `created_at` |
| Query param | `camelCase` | `?categoryId=xxx` |

> **Alasan:** Request body dan response menggunakan `snake_case` karena merupakan konvensi standar REST API yang di-expose ke client. Route param menggunakan `camelCase` karena bersifat internal.

#### TypeBox Schema

| Item | Format | Contoh |
|------|--------|--------|
| Schema name | `PascalCase` + suffix | `CreateUserBody`, `LoginResponse` |
| Suffix: request body | `Body` | `CreateProductBody` |
| Suffix: request params | `Params` | `GetProductParams` |
| Suffix: request query | `Query` | `ListProductsQuery` |
| Suffix: response | `Response` | `LoginResponse`, `OrderListResponse` |

```typescript
// Contoh penamaan schema
export const CreateOrderBody = Type.Object({...});
export const GetOrderParams = Type.Object({...});
export const OrderReportQuery = Type.Object({...});
export const OrderResponse = Type.Object({...});
```

#### Environment Variables

| Item | Format | Contoh |
|------|--------|--------|
| Env variable | `SCREAMING_SNAKE_CASE` | `DATABASE_HOST`, `JWT_SECRET` |
| Prefix group | `DATABASE_`, `IMAGEKIT_` | `DATABASE_PORT`, `IMAGEKIT_URL_ENDPOINT` |

#### Cookie

| Item | Format | Contoh |
|------|--------|--------|
| Cookie name | `snake_case` | `token`, `refresh_token` |

#### Error Message

| Item | Format | Contoh |
|------|--------|--------|
| Error message | Sentence case | `"Email already exists"`, `"Invalid credentials"` |
| Field error key | `snake_case` (match body field) | `"phone_number": "Invalid phone format"` |

#### Branch & Commit

| Item | Format | Contoh |
|------|--------|--------|
| Branch name | `kebab-case` + prefix | `feature/add-wishlist`, `fix/cart-overflow` |
| Commit scope | `kebab-case` | `feat(auth): ...`, `fix(orders): ...` |

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
