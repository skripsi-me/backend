# 008 — Dead Code Cleanup

**Status**: done
**Prioritas**: rendah
**Terkait**: Temuan #8 — uploadImage, sanitizeFields, multipart plugin tidak terpakai

---

## Goal

Hapus fungsi dan plugin yang tidak terpakai untuk mengurangi kode mati dan confusion.

---

## Konteks

- **Files terpengaruh**:
  - `src/shared/utils/imagekit.util.ts` — `uploadImage` (line 10) tidak dipanggil
  - `src/shared/utils/sanitize.util.ts` — `sanitizeFields` (line 19) tidak dipanggil
  - `src/app.ts` — multipart plugin terdaftar (line 87-91) tidak ada route yang pakai

---

## Langkah Eksekusi

### 1. Cek reference sebelum hapus

```bash
# Cek semua reference
rg "uploadImage" src/
rg "sanitizeFields" src/
rg "multipart" src/
rg "request\.file" src/
```

### 2. Hapus `uploadImage` dari `imagekit.util.ts`

Hapus fungsi `uploadImage`. Pertahankan `imagekit` instance (mungkin dipakai nanti, atau hapus juga jika tidak ada reference).

Jika `imagekit` instance juga tidak dipakai:
- Hapus seluruh isi file atau kosongkan export
- Atau hapus import di file manapun yang import dari `imagekit.util.ts`

### 3. Hapus `sanitizeFields` dari `sanitize.util.ts`

Hapus fungsi `sanitizeFields`. Pertahankan `sanitize`.

### 4. Hapus registrasi multipart dari `app.ts`

Hapus:
```typescript
await app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
```

Hapus import `multipart`:
```typescript
import multipart from '@fastify/multipart';
```

### 5. Cek apakah ada route yang perlu upload

Jika belum ada route upload image produk, biarkan dulu. Upload bisa ditambahkan nanti bersama dengan endpoint yang membutuhkannya.

---

## Definition of Done

- [x] `uploadImage` tidak ada di `imagekit.util.ts`
- [x] `sanitizeFields` tidak ada di `sanitize.util.ts`
- [x] Multipart plugin tidak terdaftar di `app.ts`
- [x] `npm run build` tanpa error
- [x] `npm test` semua pass

---

## Verifikasi

```bash
# 1. Grep — pastikan tidak ada reference
rg "uploadImage" src/
rg "sanitizeFields" src/
rg "multipart" src/

# 2. Build
npm run build

# 3. Test
npm test
```

---

## Risiko / Catatan

- **Breaking**: Tidak. Tidak ada API yang berubah.
- **File upload**: Jika perlu upload gambar produk di masa depan, tambahkan kembali multipart + uploadImage saat membuat endpoint upload.
- **ImageKit**: Pertahankan `imagekit` instance di `imagekit.util.ts` — kemungkinan besar akan dipakai nanti untuk upload.
