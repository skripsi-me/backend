# 003 — Cart Item Ownership Check

**Status**: done
**Prioritas**: sedang
**Terkait**: Temuan #3 — Cart item update/remove silent no-op

---

## Goal

Validasi ownership setelah update/delete cart item. Jika item tidak ditemukan di cart user, return error 404 bukan silent no-op.

---

## Konteks

- **File**: `src/modules/carts/carts.service.ts` — method `updateItem()` (~line 66-82), `removeItem()` (~line 84-98)
- **Masalah**: Query UPDATE/DELETE pakai `AND cart_id` tapi tidak cek affectedRows. Jika item bukan milik user, query berhasil (0 rows affected), service tetap return cart lama. User salah sangka operasi sukses.

---

## Langkah Eksekusi

### 1. Modifikasi `carts.service.ts` — `updateItem()`

```typescript
async updateItem(userId: string, itemId: string, data: UpdateCartItemBody) {
  const cart = await this.getByUserId(userId);

  const result = await db.update(cartItems)
    .set({ quantity: data.quantity })
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));

  if (result.affectedRows === 0) {
    throw new Error('Cart item not found');
  }

  return this.getByUserId(userId);
}
```

### 2. Modifikasi `carts.service.ts` — `removeItem()`

```typescript
async removeItem(userId: string, itemId: string) {
  const cart = await this.getByUserId(userId);

  const result = await db.delete(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));

  if (result.affectedRows === 0) {
    throw new Error('Cart item not found');
  }

  return this.getByUserId(userId);
}
```

### 3. Tambah error handling di `carts.controller.ts`

Pastikan controller catch error dan return 404. Bisa tambah try-catch di controller atau biarkan error propagasi ke global error handler.

```typescript
// Di carts.controller.ts — updateItem & removeItem
async updateItem(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user.id;
    const cart = await this.cartsService.updateItem(userId, request.params.itemId, request.body);
    return reply.success(cart);
  } catch (err) {
    if (err instanceof Error && err.message === 'Cart item not found') {
      return reply.status(404).send(formatError(404, 'Cart item not found'));
    }
    throw err;
  }
}
```

Lakukan hal sama untuk `removeItem`.

---

## Definition of Done

- [x] `updateItem` return 404 jika itemId tidak ada di cart user
- [x] `removeItem` return 404 jika itemId tidak ada di cart user
- [x] Item milik user lain tidak bisa diupdate/dihapus
- [x] `npm run build` tanpa error
- [x] `npm test` semua pass

---

## Verifikasi

```bash
# 1. Unit test
npm test

# 2. Manual test
# Login sebagai user A, dapat cart item id X
# Login sebagai user B, coba update/hapus item id X
# Harus: 404 "Cart item not found"

# 3. Build
npm run build
```

---

## Risiko / Catatan

- **Breaking**: Tidak. Response format sama, hanya error case berubah dari silent jadi 404.
- **Performance**: Tambahan `result.affectedRows` check — negligible.
- **Frontend**: Tidak perlu perubahan. Frontend sudah handle 404.
