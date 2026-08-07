# 007 — Type Safety `products.list` whereClause

**Status**: done
**Prioritas**: rendah
**Terkait**: Temuan #7 — `whereClause: any`

---

## Goal

Hapus `any` type di `products.list` whereClause. Gunakan Drizzle SQL builder dengan tipe yang benar.

---

## Konteks

- **File**: `src/modules/products/products.service.ts` — method `list()` (~line 90)
- **Masalah**: `whereClause: any` kehilangan type safety. Tidak ada warning jika operator atau kondisi salah.

---

## Langkah Eksekusi

### 1. Update tipe `whereClause` di `list()`

Ganti `let whereClause: any = undefined;` dengan:

```typescript
import { type SQL } from 'drizzle-orm';

// Di dalam method list():
let whereClause: SQL<unknown> | undefined = undefined;
```

### 2. Update assignment

```typescript
if (query.search) {
  whereClause = or(
    sql`MATCH(${products.name}) AGAINST(${query.search} IN NATURAL LANGUAGE MODE)`,
    sql`MATCH(${products.description}) AGAINST(${query.search} IN NATURAL LANGUAGE MODE)`
  );
}

if (query.category_id) {
  const catFilter = eq(products.categoryId, query.category_id);
  whereClause = whereClause ? and(whereClause, catFilter) : catFilter;
}
```

### 3. Pastikan import lengkap

```typescript
import { eq, or, and, sql, count, desc, like, type SQL } from 'drizzle-orm';
```

---

## Definition of Done

- [x] Tidak ada `any` di `products.service.ts`
- [x] `whereClause` ter-tipe `SQL<unknown> | undefined`
- [x] `npm run build` tanpa error
- [x] `npm test` semua pass

---

## Verifikasi

```bash
# 1. Type check
npx tsc --noEmit

# 2. Build
npm run build

# 3. Test
npm test
```

---

## Risiko / Catatan

- **Breaking**: Tidak. Hanya perubahan internal, tidak mengubah behavior.
- **Performance**: Tidak ada perubahan.
