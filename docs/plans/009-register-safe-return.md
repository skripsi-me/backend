# 009 — Register Return Safe Subset

**Status**: done
**Prioritas**: rendah
**Terkait**: Temuan #9 — Register service return user penuh (termasuk password hash)

---

## Goal

Pastikan fungsi `register` hanya return field yang aman (tanpa password hash, refresh token). Meskipun response schema sudah strip field ini, return yang defensif lebih baik.

---

## Konteks

- **File**: `src/modules/auth/auth.service.ts` — method `register()` (~line 28-40)
- **Masalah**: `return { ...user!, phone_number: ... }` menyebarkan semua field dari DB result, termasuk `password` dan `refreshToken`. Response TypeBox schema strip ini, tapi service layer seharusnya tidak mengembalikan data sensitif sama sekali.

---

## Langkah Eksekusi

### 1. Update `auth.service.ts` — `register()`

Ganti spread operator dengan return field eksplisit:

```typescript
async register(data: RegisterBody) {
  const id = ulid();
  const hashedPassword = await hashPassword(data.password);

  await db.insert(users).values({
    id,
    email: data.email,
    password: hashedPassword,
    name: sanitize(data.name),
    address: data.address ? sanitize(data.address) : null,
    phoneNumber: data.phone_number,
    role: data.role || 'user',
  });

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) throw new Error('Registration failed');

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    address: user.address,
    phone_number: user.phoneNumber,
    role: user.role,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}
```

### 2. Pastikan response schema tetap compatible

`UserSchema` di `auth.schema.ts` hanya punya field aman. Tidak perlu ubah.

---

## Definition of Done

- [x] `register()` return object dengan field eksplisit
- [x] Tidak ada `password` atau `refreshToken` di return value
- [x] `npm run build` tanpa error
- [x] `npm test` semua pass

---

## Verifikasi

```bash
# 1. Build
npm run build

# 2. Test
npm test

# 3. Manual test
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
# Response tidak boleh mengandung password atau refresh token
```

---

## Risiko / Catatan

- **Breaking**: Tidak. Response format sama.
- **Defense in depth**: Meskipun schema sudah strip, service layer yang bersih lebih aman.
