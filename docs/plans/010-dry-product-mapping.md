# 010 — DRY Mapping Produk

**Status**: done
**Prioritas**: rendah
**Terkait**: Temuan #10 — Duplikasi mapping produk di 4 fungsi

---

## Goal

Refaktor mapping produk yang terduplikasi di `getById`, `getBySlug`, `list`, `listByCategorySlug` ke helper function reusable.

---

## Konteks

- **File**: `src/modules/products/products.service.ts`
- **Masalah**: Fungsi `getById`, `getBySlug`, `list`, `listByCategorySlug` punya logic mapping yang identik (select + map ke response shape). Duplikasi = maintenance risk.

---

## Langkah Eksekusi

### 1. Buat helper `mapProductRow()`

```typescript
private mapProductRow(row: any) {
  return {
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    stock: row.stock,
    image_url: row.image_url,
    category: row.category_id ? {
      name: row.category_name,
      slug: row.category_slug,
      description: row.category_description,
    } : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
```

### 2. Refaktor `getById()`

```typescript
async getById(id: string) {
  const [product] = await db.select({
    id: products.id,
    category_id: products.categoryId,
    name: products.name,
    slug: products.slug,
    description: products.description,
    price: products.price,
    stock: products.stock,
    image_url: products.imageUrl,
    category_name: categories.name,
    category_slug: categories.slug,
    category_description: categories.description,
    created_at: products.createdAt,
    updated_at: products.updatedAt,
  })
  .from(products)
  .leftJoin(categories, eq(products.categoryId, categories.id))
  .where(eq(products.id, id)).limit(1);

  return product ? this.mapProductRow(product) : undefined;
}
```

### 3. Refaktor `getBySlug()`, `list()`, `listByCategorySlug()`

Pakai `this.mapProductRow(row)` di semua fungsi.

---

## Definition of Done

- [x] Ada helper `mapProductRow()` private
- [x] Semua fungsi produk pakai helper
- [x] Tidak ada duplikasi mapping
- [x] `npm run build` tanpa error
- [x] `npm test` semua pass

---

## Verifikasi

```bash
# 1. Build
npm run build

# 2. Test
npm test

# 3. Grep — pastikan tidak ada mapping duplikasi
rg "category_name.*category_slug" src/modules/products/
# Harus hanya ada di mapProductRow
```

---

## Risiko / Catatan

- **Breaking**: Tidak. Response format sama.
- **Maintenance**: Lebih mudah update shape di satu tempat.
- **Performance**: Negligible — satu fungsi extra call per request.
