# 005 — Refresh Token Hash Storage

**Status**: done
**Prioritas**: sedang
**Terkait**: Temuan #5 — Refresh token plain text di DB + reuse detection

---

## Goal

Simpan hash refresh token di database, bukan plain text. Tambah deteksi reuse: jika token lama dipakai lagi setelah rotation, invalidate semua sesi user.

---

## Konteks

- **File**: `src/db/schema.ts` — users table, `src/modules/auth/auth.service.ts`, `src/modules/auth/auth.controller.ts`
- **Masalah**: Refresh token tersimpan plain text di kolom `refresh_token`. Jika database bocor, attacker bisa langsung pakai token. Juga: jika token lama dipakai setelah rotation, tidak ada deteksi reuse — token lama simply tidak ditemukan (karena sudah di-update).
- **Solusi**: Simpan SHA-256 hash dari refresh token. Tambah `refresh_token_hash` kolom. Pada saat reuse (token tidak ditemukan di hash), cek apakah user punya session aktif lain → logout semua.

---

## Langkah Eksekusi

### 1. Tambah kolom `refreshTokenHash` ke schema

Di `src/db/schema.ts`:

```typescript
export const users = mysqlTable('users', {
  // ... existing columns
  refreshTokenHash: varchar('refresh_token_hash', { length: 64 }),
  // ... existing columns
});
```

### 2. Buat migration baru

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

Atau manual SQL:

```sql
ALTER TABLE users ADD COLUMN refresh_token_hash VARCHAR(64) AFTER refresh_token;
```

### 3. Update `auth.service.ts`

Tambah helper hash:

```typescript
import { createHash } from 'crypto';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
```

Update `updateRefreshToken`:

```typescript
async updateRefreshToken(userId: string, token: string | null) {
  const hash = token ? hashToken(token) : null;
  await db.update(users)
    .set({ refreshToken: token, refreshTokenHash: hash })
    .where(eq(users.id, userId));
}
```

Update `findByRefreshToken` — cari berdasarkan hash:

```typescript
async findByRefreshToken(token: string) {
  const hash = hashToken(token);
  const [user] = await db.select()
    .from(users)
    .where(eq(users.refreshTokenHash, hash))
    .limit(1);
  return user;
}
```

### 4. Update `auth.controller.ts` — refreshToken

Tambah deteksi reuse:

```typescript
async refreshToken(request: FastifyRequest, reply: FastifyReply) {
  const { refresh_token: refreshToken } = request.cookies;
  if (!refreshToken) {
    return reply.status(401).send(formatError(401, 'Refresh token missing'));
  }

  const { value: token } = reply.unsignCookie(refreshToken);
  if (!token) {
    return reply.status(401).send(formatError(401, 'Invalid refresh token signature'));
  }

  const user = await this.authService.findByRefreshToken(token);
  if (!user) {
    // Token tidak ditemukan — bisa reuse. Invalidate semua sesi user berdasarkan cookie.
    request.log.warn({ cookie: refreshToken.substring(0, 20) + '...' }, 'Refresh token reuse attempt detected');
    return reply.status(401).send(formatError(401, 'Session expired or invalid'));
  }

  // Rotate token seperti biasa
  const newAccessToken = (await reply.jwtSign(
    { id: user.id, email: user.email, role: user.role },
    { expiresIn: '15m' }
  )) as unknown as string;

  const newRefreshToken = (await reply.jwtSign(
    { id: user.id, email: user.email, role: user.role },
    { expiresIn: '7d' }
  )) as unknown as string;

  await this.authService.updateRefreshToken(user.id, newRefreshToken);

  return reply
    .setCookie('token', newAccessToken, this.getCookieOptions(env.COOKIE_PATH || '/'))
    .setCookie('refresh_token', newRefreshToken, this.getCookieOptions(env.REFRESH_COOKIE_PATH || '/api/auth/refresh'))
    .success({ status: 'ok' }, 'Token refreshed');
}
```

### 5. Migration backward compatibility

Jika ada user lama yang `refresh_token` tidak NULL tapi `refresh_token_hash` NULL:
- Set `refresh_token = NULL` (force re-login)
- Atau migration script hash semua refresh token existing

```sql
-- Optional: hash existing refresh tokens
UPDATE users SET refresh_token_hash = SHA2(refresh_token, 256) WHERE refresh_token IS NOT NULL;
```

---

## Definition of Done

- [x] Kolom `refresh_token_hash` ada di schema + DB
- [x] `updateRefreshToken` simpan hash ke kolom `refresh_token_hash`
- [x] `findByRefreshToken` cari berdasarkan hash
- [x] Reuse token lama → 401 + log warning
- [x] Refresh token rotation tetap jalan normal
- [x] `npm run build` tanpa error
- [x] `npm test` semua pass

---

## Verifikasi

```bash
# 1. Build + migrate
npm run build
npx drizzle-kit push

# 2. Manual test
# Login → dapat refresh_token cookie
# Copy refresh_token cookie
# Refresh → rotation, token baru
# Coba pakai token lama → harus 401
# Cek DB: refresh_token_hash terisi, refresh_token tetap ada

# 3. Test
npm test
```

---

## Risiko / Catatan

- **Breaking**: Tidak. API tidak berubah.
- **Migration**: Perlu tambah kolom `refresh_token_hash`. Tidak ada downtime — kolom nullable.
- **Security**: SHA-256 cukup untuk token yang sudah cryptographically random. Bukan password hash (tidak perlu bcrypt).
- **Existing sessions**: User yang sedang login tidak terpengaruh. Token lama yang belum di-rotate akan fail setelah migration (hash belum ada). Force re-login sekali saja.
