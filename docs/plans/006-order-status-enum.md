# 006 — Order Status MySQL ENUM

**Status**: done
**Prioritas**: rendah
**Terkait**: Temuan #6 — Status order varchar bebas

---

## Goal

Ganti kolom `orders.status` dari `varchar` ke MySQL ENUM untuk memastikan integritas data hanya menerima nilai yang valid.

---

## Konteks

- **File**: `src/db/schema.ts` — orders table definition (~line 62)
- **Masalah**: Kolom `status` `varchar(20)` menerima string apa pun. Meskipun validasi ada di TypeBox schema route, data bisa di-insert langsung ke DB (via admin, bug, atau migration) dengan status tidak valid.
- **Solusi**: MySQL ENUM membatasi nilai di level database.

---

## Langkah Eksekusi

### 1. Update schema — ganti varchar ke ENUM

Di `src/db/schema.ts`:

```typescript
import { mysqlEnum, varchar, ... } from 'drizzle-orm/mysql-core';

export const orders = mysqlTable('orders', {
  id: varchar('id', { length: 26 }).primaryKey(),
  userId: varchar('user_id', { length: 26 }).references(() => users.id).notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum('status', ['pending', 'shipped', 'delivered', 'cancelled']).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIndex: index('user_id_idx').on(table.userId),
  createdAtIndex: index('created_at_idx').on(table.createdAt),
}));
```

### 2. Generate + push migration

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

### 3. Cek data existing

Pastikan tidak ada data dengan status selain yang valid:

```sql
SELECT DISTINCT status FROM orders;
-- Harus hanya: pending, shipped, delivered, cancelled
```

Jika ada data invalid, bersihkan dulu sebelum push migration.

### 4. Pastikan `orders.service.ts` tetap compatible

`updateStatus(id, status: string)` — tetap terima string, tapi sekarang MySQL ENUM akan reject otomatis jika status tidak valid.

---

## Definition of Done

- [x] Kolom `orders.status` pakai MySQL ENUM
- [x] Enum values: `pending`, `shipped`, `delivered`, `cancelled`
- [x] Default tetap `pending`
- [x] Data existing tidak ada yang invalid
- [x] `npm run build` tanpa error
- [x] `npm test` semua pass

---

## Verifikasi

```bash
# 1. Build + migrate
npm run build
npx drizzle-kit push

# 2. Cek schema di DB
mysql -u root -p skripsi_db -e "DESCRIBE orders;"
# status column harus ENUM

# 3. Test insert invalid status
mysql -u root -p skripsi_db -e "INSERT INTO orders (id, user_id, total_amount, status) VALUES ('test', 'test', 0, 'invalid');"
# Harus: ERROR 1406 (22001): Data too long for column 'status'

# 4. Test
npm test
```

---

## Risiko / Catatan

- **Breaking**: Tidak. API tidak berubah.
- **Migration**: Kolom varchar → ENUM. MySQL akan convert existing data. Pastikan data valid sebelum migration.
- **Tambah status baru**: Jika di masa depan perlu tambah status (misal `refunded`), perlu ALTER TABLE tambah ENUM value. Lebih ribet dari varchar, tapi lebih aman.
- **TypeScript**: Drizzle akan infer `status` sebagai union type `'pending' | 'shipped' | 'delivered' | 'cancelled'` — type safety lebih kuat.
