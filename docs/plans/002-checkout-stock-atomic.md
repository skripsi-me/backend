# 002 — Checkout Stock Atomic Update

**Status**: done
**Prioritas**: tinggi
**Terkait**: Temuan #2 — Race condition stock checkout (oversell)

---

## Goal

Ganti mekanisme stock check + decrement (SELECT → UPDATE terpisah) dengan atomic UPDATE + affectedRows check. Eliminasi race condition yang memungkinkan 2 checkout paralel oversell produk yang sama.

---

## Konteks

- **File**: `src/modules/orders/orders.service.ts` — method `createFromCart()` (~line 90-135)
- **Masalah**: Sekarang pakai loop SELECT stock → cek cukup → UPDATE stock. Di antara SELECT dan UPDATE, request lain bisa mengurangi stock. Hasil: stock minus.
- **Transaction isolation**: MySQL default `REPEATABLE READ`. SELECT di awal transaction tidak lihat perubahan dari transaction lain sampai COMMIT. Tapi UPDATE tetap bisa clash.
- **Solution**: `UPDATE ... WHERE stock >= quantity` — atomic check-and-decrement dalam satu statement.

---

## Langkah Eksekusi

### 1. Modifikasi `orders.service.ts` — `createFromCart()`

Ganti loop SELECT stock check + loop UPDATE stock terpisah dengan atomic decrement:

**Hapus** (di dalam transaction, loop pertama):
```typescript
for (const item of cart.items) {
  const [product] = await tx.select({ stock: products.stock })
    .from(products)
    .where(eq(products.id, item.product_id))
    .limit(1);
  if (!product) throw new Error(`Product not found: ${item.product_id}`);
  if (product.stock < item.quantity) {
    throw new Error(`Insufficient stock for ${item.product!.name}. Available: ${product.stock}, requested: ${item.quantity}`);
  }
}
```

**Hapus** (loop UPDATE stock di akhir transaction):
```typescript
for (const item of cart.items) {
  await tx.update(products)
    .set({ stock: sql`${products.stock} - ${item.quantity}` })
    .where(eq(products.id, item.product_id));
}
```

**Tambahkan** (sebelum INSERT order, setelah INSERT orderItems):
```typescript
// Atomic stock decrement — cek affectedRows
for (const item of cart.items) {
  const result = await tx.update(products)
    .set({ stock: sql`stock - ${item.quantity}` })
    .where(
      and(
        eq(products.id, item.product_id),
        sql`stock >= ${item.quantity}`
      )
    );

  // affectedRows === 0 berarti stock tidak cukup
  if (result.affectedRows === 0) {
    // Ambil nama produk untuk pesan error
    const [product] = await tx.select({ name: products.name, stock: products.stock })
      .from(products)
      .where(eq(products.id, item.product_id))
      .limit(1);
    const name = product?.name || item.product_id;
    const available = product?.stock ?? 0;
    throw new Error(`Insufficient stock for ${name}. Available: ${available}, requested: ${item.quantity}`);
  }
}
```

### 2. Tambah import `and` di orders.service.ts

```typescript
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';
// and sudah ada — pastikan ada
```

### 3. Perbarui test orders (jika ada)

Tambah test case:
- Checkout dengan stock cukup → berhasil, stock berkurang
- Checkout dengan stock tidak cukup → gagal, error message benar, stock tidak berubah

---

## Definition of Done

- [x] SELECT stock check dihapus dari transaction
- [x] UPDATE stock pakai `WHERE stock >= quantity`
- [x] affectedRows === 0 → throw Error dengan nama produk + stock tersedia
- [x] Stock tidak bisa minus (verified di DB constraint atau test)
- [x] `npm run build` tanpa error
- [x] `npm test` semua pass

---

## Verifikasi

```bash
# 1. Unit test
npm test

# 2. Manual test — buat produk stock = 1
# Buka 2 terminal, jalankan checkout bersamaan:
# Terminal 1: POST /api/orders (harus berhasil)
# Terminal 2: POST /api/orders (harus gagal "Insufficient stock")
# Cek: stock produk = 0, tidak minus

# 3. Build
npm run build
```

---

## Risiko / Catatan

- **Backward compatible**: API tidak berubah. Error message tetap sama formatnya.
- **Performance**: Lebih cepat — satu UPDATE statement per item, bukan SELECT + UPDATE terpisah.
- **Edge case**: Jika produk dihapus (hard delete) saat checkout, `affectedRows === 0` akan trigger "Product not found" — behavior benar.
- **Transaction duration**: Lebih pendek karena mengurangi SELECT query.
