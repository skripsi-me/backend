# Dokumentasi API — E-Commerce Backend

> **Canonical source**: Dokumen ini adalah satu-satunya referensi API resmi. Update saat schema/endpoint berubah.

> Base URL: `http://localhost:3000` (development)  
> Base URL Production: `https://<your-domain>` (sesuaikan)

---

## Daftar Isi

1. [Autentikasi](#autentikasi)
2. [Format Response Standar](#format-response-standar)
3. [Penanganan Error](#penanganan-error)
4. [Pagination](#pagination)
5. [Rate Limiting](#rate-limiting)
6. [Health Check](#health-check)
7. [Auth Module](#auth-module)
8. [Users Module](#users-module)
9. [Categories Module](#categories-module)
10. [Products Module](#products-module)
11. [Carts Module](#carts-module)
12. [Orders Module](#orders-module)

---

## Autentikasi

API ini menggunakan **JWT yang disimpan di HttpOnly signed cookies**.

### Cookie yang Digunakan

| Cookie | Fungsi | Masa Aktif | Path |
|---|---|---|---|
| `token` | Access token (JWT) | 15 menit | `/` |
| `refresh_token` | Refresh token (JWT) | 7 hari | `/api/auth/refresh` |

### Cara Login

1. Kirim `POST /api/auth/login` dengan email + password
2. Server mengatur cookie `token` dan `refresh_token` secara otomatis
3. Kirim request berikutnya — cookie otomatis dikirim browser/klien

### Token Refresh

1. Access token expires setelah 15 menit
2. Kirim `POST /api/auth/refresh` — server mengrotasi token baru
3. Cookie `token` dan `refresh_token` diupdate otomatis

### Level Autentikasi

| Level | Keterangan |
|---|---|
| **Tanpa autentikasi** | Endpoint publik, tidak perlu cookie |
| **authenticate** | Harus punya cookie `token` yang valid |
| **adminOnly** | Harus login + role = `admin` |

---

## Format Response Standar

Semua endpoint mengembalikan response dengan wrapper standar:

### Success Response

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": { ... }
}
```

### Error Response

```json
{
  "metadata": {
    "code": 400,
    "message": "Data yang dikirim tidak valid. Periksa kembali isian Anda."
  },
  "error": {
    "email": "harus berupa email yang valid.",
    "password": "harus berupa teks."
  }
}
```

Field `error` hanya muncul untuk validation errors (status 400). Error lainnya tidak punya field `error`.

> Pesan error field (`error` object) diterjemahkan otomatis ke Bahasa Indonesia dari validasi TypeBox.

---

## Penanganan Error

### Status Code yang Digunakan

| Code | Keterangan |
|---|---|
| `200` | Berhasil |
| `201` | Berhasil membuat resource baru |
| `400` | Request salah (validation error, data tidak lengkap) |
| `401` | Tidak terautentikasi (token tidak ada/invalid) |
| `403` | Tidak punya izin (bukan admin) |
| `404` | Resource tidak ditemukan |
| `409` | Konflik (email sudah terdaftar, dll) |
| `429` | Terlalu banyak request (rate limit) |
| `500` | Server error |

### Validation Error

Ketika request body tidak sesuai schema, server mengembalikan:

```json
{
  "metadata": {
    "code": 400,
    "message": "Data yang dikirim tidak valid. Periksa kembali isian Anda."
  },
  "error": {
    "body/email": "harus berupa email yang valid.",
    "body/password": "harus berupa teks."
  }
}
```

Field `error` berisi object dengan key berupa path field yang salah dan value berupa pesan error.

### Authentication Error

```json
{
  "metadata": {
    "code": 401,
    "message": "Sesi berakhir. Silakan login kembali."
  }
}
```

### Authorization Error

```json
{
  "metadata": {
    "code": 403,
    "message": "Akses khusus admin. Anda tidak memiliki izin."
  }
}
```

### Not Found Error

```json
{
  "metadata": {
    "code": 404,
    "message": "Produk tidak ditemukan."
  }
}
```

### Conflict Error

> Contoh: admin membuat user dengan email yang sudah terdaftar (`POST /api/users`).

```json
{
  "metadata": {
    "code": 409,
    "message": "Email sudah terdaftar. Gunakan email lain."
  }
}
```

### Route Not Found

Ketika path tidak terdaftar, server mengembalikan:

```json
{
  "metadata": {
    "code": 404,
    "message": "Halaman tidak ditemukan."
  }
}
```

### Payload/File Terlalu Besar

```json
{
  "metadata": {
    "code": 413,
    "message": "Ukuran file terlalu besar. Maksimal 5MB."
  }
}
```

### Unsupported Media Type

```json
{
  "metadata": {
    "code": 415,
    "message": "Format data tidak didukung. Gunakan JSON atau multipart/form-data."
  }
}
```

---

## Pagination

Beberapa endpoint mendukung pagination. Gunakan query params:

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `page` | number | `1` | Nomor halaman (minimal 1) |
| `limit` | number | `20` | Item per halaman (minimal 1, maksimal 1000) |

### Contoh Request

```
GET /api/products?page=2&limit=10
```

### Response Pagination

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "data": [ ... ],
    "meta": {
      "total": 85,
      "page": 2,
      "limit": 10,
      "total_pages": 9
    }
  }
}
```

---

## Rate Limiting

| Endpoint | Batas | Window |
|---|---|---|
| Semua endpoint | 100 request | 1 menit |
| `POST /api/auth/register` | 3 request | 1 menit |
| `POST /api/auth/login` | 5 request | 1 menit |
| `POST /api/auth/refresh` | 10 request | 1 menit |

### Rate Limit Response

```json
{
  "statusCode": 429,
  "error": "Terlalu Banyak Permintaan",
  "message": "Terlalu banyak permintaan. Maksimal 5 permintaan per menit. Silakan tunggu sebentar."
}
```

---

## Health Check

### `GET /health`

Cek status server.

**Autentikasi**: Tidak

**Response 200:**

```json
{
  "status": "ok"
}
```

> Catatan: Response ini tidak menggunakan wrapper standar.

---

## Auth Module

Prefix: `/api/auth`

---

### `POST /api/auth/register`

Membuat akun user baru.

**Autentikasi**: Tidak  
**Rate Limit**: 3 request/menit

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `email` | string | Ya | Format email valid |
| `password` | string | Ya | Minimal 8 karakter |
| `name` | string | Ya | Minimal 1 karakter |
| `address` | string | Tidak | Alamat user |
| `phone_number` | string | Tidak | Nomor telepon |
| `role` | string | Tidak | `"user"` atau `"admin"` (default: `"user"`) |

**Contoh Request:**

```json
POST /api/auth/register
Content-Type: application/json

{
  "email": "budi@example.com",
  "password": "password123",
  "name": "Budi Santoso",
  "address": "Jl. Sudirman No. 123, Jakarta",
  "phone_number": "081234567890",
  "role": "user"
}
```

**Response 201 Success:**

```json
{
  "metadata": {
    "code": 201,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJKLM",
    "email": "budi@example.com",
    "name": "Budi Santoso",
    "address": "Jl. Sudirman No. 123, Jakarta",
    "phone_number": "081234567890",
    "role": "user",
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 400 | Email format salah | `Data yang dikirim tidak valid. Periksa kembali isian Anda.` |
| 400 | Password kurang dari 8 karakter | `Data yang dikirim tidak valid. Periksa kembali isian Anda.` |
| 403 | Non-admin coba register sebagai admin | `Hanya admin yang dapat mendaftarkan akun admin.` |

---

### `POST /api/auth/login`

Login dan mendapatkan session cookies.

**Autentikasi**: Tidak  
**Rate Limit**: 5 request/menit

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `email` | string | Ya | Format email valid |
| `password` | string | Ya | Password user |

**Contoh Request:**

```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "budi@example.com",
  "password": "password123"
}
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "status": "ok"
  }
}
```

> **Penting**: Server mengatur cookie `token` (access token) dan `refresh_token` (refresh token) secara otomatis. Cookie ini harus dikirim pada request berikutnya.

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 400 | Email atau password kosong | `Data yang dikirim tidak valid. Periksa kembali isian Anda.` |
| 401 | Email atau password salah | `Email atau password salah, gunakan email dan password yang sudah terdaftar.` |

---

### `POST /api/auth/refresh`

Refresh access token menggunakan refresh token dari cookie.

**Autentikasi**: Tidak (membaca cookie `refresh_token` secara internal)  
**Rate Limit**: 10 request/menit

**Request Body:** Tidak ada

**Contoh Request:**

```json
POST /api/auth/refresh
Cookie: refresh_token=<signed-refresh-token>
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "status": "ok"
  }
}
```

> Cookie `token` dan `refresh_token` diupdate dengan token baru (rotasi).

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Cookie `refresh_token` tidak ada | `Sesi berakhir. Silakan login kembali.` |
| 401 | Signature cookie invalid | `Sesi tidak valid. Silakan login kembali.` |
| 401 | Token tidak ditemukan di DB (reuse) | `Sesi berakhir atau tidak valid. Silakan login kembali.` |

---

### `POST /api/auth/logout`

Logout dan clear cookies.

**Autentikasi**: Tidak  
**Rate Limit**: 100 request/menit (default)

**Request Body:** Tidak ada

**Contoh Request:**

```json
POST /api/auth/logout
Cookie: token=<signed-token>; refresh_token=<signed-refresh-token>
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "status": "ok"
  }
}
```

> Cookie `token` dan `refresh_token` di-clear (di-set kosong).

---

### `POST /api/auth/change-password`

Ganti password user yang sedang login.

**Autentikasi**: authenticate  
**Rate Limit**: 100 request/menit (default)

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `old_password` | string | Ya | Password lama |
| `new_password` | string | Ya | Password baru, minimal 8 karakter |

**Contoh Request:**

```json
POST /api/auth/change-password
Content-Type: application/json
Cookie: token=<signed-token>

{
  "old_password": "password123",
  "new_password": "newpassword456"
}
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "status": "ok"
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 400 | Password lama salah | `Password lama salah. Periksa kembali password Anda.` |
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |

---

## Users Module

Prefix: `/api/users`

> **Catatan**: Semua endpoint di module ini memerlukan autentikasi (module-level hook `authenticate`).

---

### `GET /api/users/me`

Mendapatkan profil user yang sedang login.

**Autentikasi**: authenticate  
**Rate Limit**: 100 request/menit (default)

**Request:** Tidak ada params, body, atau query

**Contoh Request:**

```json
GET /api/users/me
Cookie: token=<signed-token>
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJKLM",
    "email": "budi@example.com",
    "name": "Budi Santoso",
    "address": "Jl. Sudirman No. 123, Jakarta",
    "phone_number": "081234567890",
    "role": "user"
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |

---

### `PATCH /api/users/me`

Update profil user yang sedang login.

**Autentikasi**: authenticate  
**Rate Limit**: 100 request/menit (default)

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `name` | string | Tidak | Nama baru (minimal 1 karakter) |
| `address` | string | Tidak | Alamat baru |
| `phone_number` | string | Tidak | Nomor telepon baru |

> Catatan: User tidak bisa mengubah `email`, `password`, atau `role` dari sini.

**Contoh Request:**

```json
PATCH /api/users/me
Content-Type: application/json
Cookie: token=<signed-token>

{
  "name": "Budi Santoso Updated",
  "phone_number": "081987654321"
}
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJKLM",
    "email": "budi@example.com",
    "name": "Budi Santoso Updated",
    "address": "Jl. Sudirman No. 123, Jakarta",
    "phone_number": "081987654321",
    "role": "user"
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |

---

### `GET /api/users/`

Mendapatkan daftar semua user (admin only, dengan pagination).

**Autentikasi**: adminOnly  
**Rate Limit**: 100 request/menit (default)

**Query Params:**

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `page` | number | `1` | Nomor halaman |
| `limit` | number | `20` | Item per halaman |
| `sort` | string | `desc` | Urutan sort berdasarkan `created_at`. Nilai: `asc` (terlama dulu) atau `desc` (terbaru dulu) |

**Contoh Request:**

```json
GET /api/users/?page=1&limit=10&sort=asc
Cookie: token=<admin-signed-token>
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "data": [
      {
        "id": "01HXYZ123456789ABCDEFGHIJKLM",
        "email": "budi@example.com",
        "name": "Budi Santoso",
        "address": "Jl. Sudirman No. 123, Jakarta",
        "phone_number": "081234567890",
        "role": "user"
      },
      {
        "id": "01HXYZ123456789ABCDEFGHIJN",
        "email": "admin@example.com",
        "name": "Admin Utama",
        "address": null,
        "phone_number": null,
        "role": "admin"
      }
    ],
    "meta": {
      "total": 2,
      "page": 1,
      "limit": 10,
      "total_pages": 1
    }
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Bukan admin | `Akses khusus admin. Anda tidak memiliki izin.` |

---

### `GET /api/users/:id`

Mendapatkan data user berdasarkan ID (admin only).

**Autentikasi**: adminOnly  
**Rate Limit**: 100 request/menit (default)

**Params:**

| Param | Tipe | Keterangan |
|---|---|---|
| `id` | string | ULID user (26 karakter) |

**Contoh Request:**

```json
GET /api/users/01HXYZ123456789ABCDEFGHIJKLM
Cookie: token=<admin-signed-token>
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJKLM",
    "email": "budi@example.com",
    "name": "Budi Santoso",
    "address": "Jl. Sudirman No. 123, Jakarta",
    "phone_number": "081234567890",
    "role": "user"
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Bukan admin | `Akses khusus admin. Anda tidak memiliki izin.` |
| 404 | User tidak ditemukan | `Pengguna tidak ditemukan.` |

---

### `POST /api/users/`

Membuat user baru (admin only).

**Autentikasi**: adminOnly  
**Rate Limit**: 100 request/menit (default)

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `email` | string | Ya | Format email valid |
| `password` | string | Ya | Minimal 8 karakter |
| `name` | string | Ya | Minimal 1 karakter |
| `address` | string | Tidak | Alamat user |
| `phone_number` | string | Tidak | Nomor telepon |
| `role` | string | Tidak | `"user"` atau `"admin"` (default: `"user"`) |

**Contoh Request:**

```json
POST /api/users/
Content-Type: application/json
Cookie: token=<admin-signed-token>

{
  "email": "baru@example.com",
  "password": "password123",
  "name": "User Baru",
  "role": "user"
}
```

**Response 201 Success:**

```json
{
  "metadata": {
    "code": 201,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJN",
    "email": "baru@example.com",
    "name": "User Baru",
    "address": null,
    "phone_number": null,
    "role": "user"
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 400 | Validation error | `Data yang dikirim tidak valid. Periksa kembali isian Anda.` |
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Bukan admin | `Akses khusus admin. Anda tidak memiliki izin.` |
| 409 | Email sudah terdaftar | `Email sudah terdaftar. Gunakan email lain.` |

---

### `PATCH /api/users/:id`

Update data user (admin only).

**Autentikasi**: adminOnly  
**Rate Limit**: 100 request/menit (default)

**Params:**

| Param | Tipe | Keterangan |
|---|---|---|
| `id` | string | ULID user (26 karakter) |

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `email` | string | Tidak | Email baru |
| `password` | string | Tidak | Password baru (minimal 8 karakter) |
| `name` | string | Tidak | Nama baru |
| `address` | string | Tidak | Alamat baru |
| `phone_number` | string | Tidak | Nomor telepon baru |
| `role` | string | Tidak | Role baru (`"user"` atau `"admin"`) |

**Contoh Request:**

```json
PATCH /api/users/01HXYZ123456789ABCDEFGHIJKLM
Content-Type: application/json
Cookie: token=<admin-signed-token>

{
  "name": "Budi Updated",
  "role": "admin"
}
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJKLM",
    "email": "budi@example.com",
    "name": "Budi Updated",
    "address": "Jl. Sudirman No. 123, Jakarta",
    "phone_number": "081234567890",
    "role": "admin"
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 400 | Validation error | `Data yang dikirim tidak valid. Periksa kembali isian Anda.` |
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Bukan admin | `Akses khusus admin. Anda tidak memiliki izin.` |
| 404 | User tidak ditemukan | `Pengguna tidak ditemukan.` |

---

### `DELETE /api/users/:id`

Hapus user (admin only).

**Autentikasi**: adminOnly  
**Rate Limit**: 100 request/menit (default)

**Params:**

| Param | Tipe | Keterangan |
|---|---|---|
| `id` | string | ULID user (26 karakter) |

**Contoh Request:**

```json
DELETE /api/users/01HXYZ123456789ABCDEFGHIJKLM
Cookie: token=<admin-signed-token>
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "success": true
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Bukan admin | `Akses khusus admin. Anda tidak memiliki izin.` |

---

## Categories Module

Prefix: `/api/categories`

> **Catatan**: Endpoint GET bersifat publik. Endpoint POST, PATCH, DELETE memerlukan adminOnly.

---

### `GET /api/categories/`

Mendapatkan semua kategori.

**Autentikasi**: Tidak  
**Rate Limit**: 100 request/menit (default)

**Request:** Tidak ada params, body, atau query

**Contoh Request:**

```json
GET /api/categories/
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": [
    {
      "id": "01HXYZ123456789ABCDEFGHIJN",
      "name": "Elektronik",
      "slug": "elektronik",
      "description": "Perangkat elektronik dan gadget",
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "01HXYZ123456789ABCDEFGHIJO",
      "name": "Fashion",
      "slug": "fashion",
      "description": "Pakaian dan aksesoris",
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/categories/:slug`

Mendapatkan satu kategori berdasarkan slug.

**Autentikasi**: Tidak  
**Rate Limit**: 100 request/menit (default)

**Params:**

| Param | Tipe | Keterangan |
|---|---|---|
| `slug` | string | Slug kategori |

**Contoh Request:**

```json
GET /api/categories/elektronik
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJN",
    "name": "Elektronik",
    "slug": "elektronik",
    "description": "Perangkat elektronik dan gadget",
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 404 | Kategori tidak ditemukan | `Kategori tidak ditemukan.` |

---

### `POST /api/categories/`

Membuat kategori baru (admin only).

**Autentikasi**: adminOnly  
**Rate Limit**: 100 request/menit (default)

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `name` | string | Ya | Nama kategori (minimal 1 karakter) |
| `description` | string | Tidak | Deskripsi kategori |

> Slug di-generate otomatis dari name.

**Contoh Request:**

```json
POST /api/categories/
Content-Type: application/json
Cookie: token=<admin-signed-token>

{
  "name": "Otomotif",
  "description": "Suku cadang dan aksesoris kendaraan"
}
```

**Response 201 Success:**

```json
{
  "metadata": {
    "code": 201,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJP",
    "name": "Otomotif",
    "slug": "otomotif",
    "description": "Suku cadang dan aksesoris kendaraan",
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 400 | Nama kosong | `Data yang dikirim tidak valid. Periksa kembali isian Anda.` |
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Bukan admin | `Akses khusus admin. Anda tidak memiliki izin.` |

---

### `PATCH /api/categories/:id`

Update kategori (admin only).

**Autentikasi**: adminOnly  
**Rate Limit**: 100 request/menit (default)

**Params:**

| Param | Tipe | Keterangan |
|---|---|---|
| `id` | string | ULID kategori (26 karakter) |

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `name` | string | Tidak | Nama kategori baru |
| `description` | string | Tidak | Deskripsi baru |

> Jika name berubah, slug di-generate ulang otomatis.

**Contoh Request:**

```json
PATCH /api/categories/01HXYZ123456789ABCDEFGHIJP
Content-Type: application/json
Cookie: token=<admin-signed-token>

{
  "name": "Otomotif & Kendaraan",
  "description": "Suku cadang, aksesoris, dan perlengkapan kendaraan"
}
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJP",
    "name": "Otomotif & Kendaraan",
    "slug": "otomotif--kendaraan",
    "description": "Suku cadang, aksesoris, dan perlengkapan kendaraan",
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Bukan admin | `Akses khusus admin. Anda tidak memiliki izin.` |
| 404 | Kategori tidak ditemukan | `Kategori tidak ditemukan.` |

---

### `DELETE /api/categories/:id`

Hapus kategori (admin only).

**Autentikasi**: adminOnly  
**Rate Limit**: 100 request/menit (default)

**Params:**

| Param | Tipe | Keterangan |
|---|---|---|
| `id` | string | ULID kategori (26 karakter) |

**Contoh Request:**

```json
DELETE /api/categories/01HXYZ123456789ABCDEFGHIJP
Cookie: token=<admin-signed-token>
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "success": true
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Bukan admin | `Akses khusus admin. Anda tidak memiliki izin.` |

---

## Products Module

Prefix: `/api/products`

> **Catatan**: Endpoint GET bersifat publik. Endpoint POST, PATCH, DELETE memerlukan adminOnly. POST dan PATCH mendukung `multipart/form-data` untuk upload gambar.

> **Slug**: Di-generate otomatis dari `name` dan di-truncate maksimal 100 karakter. Route param slug mendukung hingga 255 karakter (`maxParamLength`).

---

### `GET /api/products/best-sellers`

Mendapatkan produk terlaris berdasarkan total quantity terjual.

**Autentikasi**: Tidak  
**Rate Limit**: 100 request/menit (default)

**Query Params:**

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `page` | number | `1` | Nomor halaman |
| `limit` | number | `20` | Jumlah produk (default 20) |

**Contoh Request:**

```json
GET /api/products/best-sellers?limit=3
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": [
    {
      "id": "01HXYZ123456789ABCDEFGHIJQ",
      "category_id": "01HXYZ123456789ABCDEFGHIJN",
      "name": "iPhone 15 Pro Max",
      "slug": "iphone-15-pro-max",
      "description": "Smartphone Apple terbaru",
      "price": "18999000.00",
      "stock": 25,
      "image_url": "https://ik.imagekit.io/xxx/iphone15.jpg",
      "category": {
        "name": "Elektronik",
        "slug": "elektronik",
        "description": "Perangkat elektronik dan gadget"
      },
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-01-01T00:00:00.000Z",
      "total_sold": 150
    }
  ]
}
```

---

### `GET /api/products/`

Mendapatkan daftar produk dengan pagination, pencarian, dan filter.

**Autentikasi**: Tidak  
**Rate Limit**: 100 request/menit (default)

**Query Params:**

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `page` | number | `1` | Nomor halaman |
| `limit` | number | `20` | Item per halaman |
| `search` | string | - | Kata kunci pencarian (pada name/description) |
| `category_id` | string | - | Filter berdasarkan ID kategori |
| `sort` | string | `desc` | Urutan sort berdasarkan `created_at`. Nilai: `asc` (terlama dulu) atau `desc` (terbaru dulu) |
| `stock` | string | - | Urutan sort berdasarkan `stock`. Nilai: `asc` (stok terkecil dulu) atau `desc` (stok terbesar dulu). Menggantikan `sort` jika dikirim |

**Contoh Request:**

```json
GET /api/products/?page=1&limit=10&search=iphone&category_id=01HXYZ123456789ABCDEFGHIJN&sort=asc&stock=desc
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "data": [
      {
        "id": "01HXYZ123456789ABCDEFGHIJQ",
        "category_id": "01HXYZ123456789ABCDEFGHIJN",
        "name": "iPhone 15 Pro Max",
        "slug": "iphone-15-pro-max",
        "description": "Smartphone Apple terbaru",
        "price": "18999000.00",
        "stock": 25,
        "image_url": "https://ik.imagekit.io/xxx/iphone15.jpg",
        "category": {
          "name": "Elektronik",
          "slug": "elektronik",
          "description": "Perangkat elektronik dan gadget"
        },
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-01T00:00:00.000Z"
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "total_pages": 1
    }
  }
}
```

---

### `GET /api/products/:id`

Mendapatkan produk berdasarkan ID (admin only).

**Autentikasi**: adminOnly  
**Rate Limit**: 100 request/menit (default)

**Params:**

| Param | Tipe | Keterangan |
|---|---|---|
| `id` | string | ULID produk (26 karakter) |

**Contoh Request:**

```json
GET /api/products/01HXYZ123456789ABCDEFGHIJQ
Cookie: token=<admin-signed-token>
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJQ",
    "category_id": "01HXYZ123456789ABCDEFGHIJN",
    "name": "iPhone 15 Pro Max",
    "slug": "iphone-15-pro-max",
    "description": "Smartphone Apple terbaru",
    "price": "18999000.00",
    "stock": 25,
    "image_url": "https://ik.imagekit.io/xxx/iphone15.jpg",
    "category": {
      "name": "Elektronik",
      "slug": "elektronik",
      "description": "Perangkat elektronik dan gadget"
    },
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Bukan admin | `Akses khusus admin. Anda tidak memiliki izin.` |
| 404 | Produk tidak ditemukan | `Produk tidak ditemukan.` |

---

### `GET /api/products/slug/:slug`

Mendapatkan produk berdasarkan slug.

**Autentikasi**: Tidak  
**Rate Limit**: 100 request/menit (default)

**Params:**

| Param | Tipe | Keterangan |
|---|---|---|
| `slug` | string | Slug produk |

**Contoh Request:**

```json
GET /api/products/slug/iphone-15-pro-max
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJQ",
    "category_id": "01HXYZ123456789ABCDEFGHIJN",
    "name": "iPhone 15 Pro Max",
    "slug": "iphone-15-pro-max",
    "description": "Smartphone Apple terbaru",
    "price": "18999000.00",
    "stock": 25,
    "image_url": "https://ik.imagekit.io/xxx/iphone15.jpg",
    "category": {
      "name": "Elektronik",
      "slug": "elektronik",
      "description": "Perangkat elektronik dan gadget"
    },
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 404 | Produk tidak ditemukan | `Produk tidak ditemukan.` |

---

### `GET /api/products/category/:categorySlug`

Mendapatkan produk berdasarkan slug kategori.

**Autentikasi**: Tidak  
**Rate Limit**: 100 request/menit (default)

**Params:**

| Param | Tipe | Keterangan |
|---|---|---|
| `categorySlug` | string | Slug kategori |

**Query Params:**

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `page` | number | `1` | Nomor halaman |
| `limit` | number | `20` | Item per halaman |
| `sort` | string | `desc` | Urutan sort berdasarkan `created_at`. Nilai: `asc` (terlama dulu) atau `desc` (terbaru dulu) |

**Contoh Request:**

```json
GET /api/products/category/elektronik?page=1&limit=5&sort=asc
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "data": [
      {
        "id": "01HXYZ123456789ABCDEFGHIJQ",
        "category_id": "01HXYZ123456789ABCDEFGHIJN",
        "name": "iPhone 15 Pro Max",
        "slug": "iphone-15-pro-max",
        "description": "Smartphone Apple terbaru",
        "price": "18999000.00",
        "stock": 25,
        "image_url": "https://ik.imagekit.io/xxx/iphone15.jpg",
        "category": {
          "name": "Elektronik",
          "slug": "elektronik",
          "description": "Perangkat elektronik dan gadget"
        },
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-01T00:00:00.000Z"
      }
    ],
    "meta": {
      "total": 15,
      "page": 1,
      "limit": 5,
      "total_pages": 3
    }
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 404 | Kategori tidak ditemukan | `Kategori tidak ditemukan.` |

---

### `POST /api/products/`

Membuat produk baru (admin only). Mendukung upload gambar via multipart/form-data.

**Autentikasi**: adminOnly  
**Rate Limit**: 100 request/menit (default)  
**Content-Type**: `multipart/form-data` atau `application/json`

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `name` | string | Ya | Nama produk (minimal 1 karakter) |
| `description` | string | Tidak | Deskripsi produk |
| `price` | number | Ya | Harga produk (>= 0) |
| `stock` | number | Ya | Stok produk (>= 0) |
| `category_id` | string | Ya | ID kategori (ULID) |
| `image_url` | string | Tidak | URL gambar produk |
| `image` | file | Tidak | File gambar untuk diupload ke ImageKit |

> **Upload Gambar**: Kirim sebagai `multipart/form-data`. Field `image` berisi file gambar.  
> **Prioritas**: Jika `image` file dikirim, `image_url` diabaikan. Jika `image` tidak dikirim, `image_url` dipakai.

**Contoh Request (multipart/form-data):**

```
POST /api/products/
Content-Type: multipart/form-data; boundary=----FormBoundary
Cookie: token=<admin-signed-token>

------FormBoundary
Content-Disposition: form-data; name="name"

Samsung Galaxy S24 Ultra
------FormBoundary
Content-Disposition: form-data; name="description"

Smartphone Samsung terbaru
------FormBoundary
Content-Disposition: form-data; name="price"

19999000
------FormBoundary
Content-Disposition: form-data; name="stock"

30
------FormBoundary
Content-Disposition: form-data; name="category_id"

01HXYZ123456789ABCDEFGHIJN
------FormBoundary
Content-Disposition: form-data; name="image"; filename="galaxy-s24.jpg"
Content-Type: image/jpeg

<binary file content>
------FormBoundary--
```

**Contoh Request (JSON tanpa gambar):**

```json
POST /api/products/
Content-Type: application/json
Cookie: token=<admin-signed-token>

{
  "name": "Samsung Galaxy S24 Ultra",
  "description": "Smartphone Samsung terbaru",
  "price": 19999000,
  "stock": 30,
  "category_id": "01HXYZ123456789ABCDEFGHIJN",
  "image_url": "https://example.com/galaxy-s24.jpg"
}
```

**Response 201 Success:**

```json
{
  "metadata": {
    "code": 201,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJR",
    "category_id": "01HXYZ123456789ABCDEFGHIJN",
    "name": "Samsung Galaxy S24 Ultra",
    "slug": "samsung-galaxy-s24-ultra",
    "description": "Smartphone Samsung terbaru",
    "price": "19999000.00",
    "stock": 30,
    "image_url": "https://ik.imagekit.io/xxx/galaxy-s24.jpg",
    "category": {
      "name": "Elektronik",
      "slug": "elektronik",
      "description": "Perangkat elektronik dan gadget"
    },
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 400 | Field wajib tidak ada | `Field wajib belum lengkap: nama, harga, stok, kategori. Harap lengkapi isian.` |
| 400 | Tipe file tidak valid | `Tipe file tidak valid: text/plain. Tipe yang diizinkan: image/jpeg, image/png, image/webp, image/gif.` |
| 400 | Upload gagal | `Gagal mengunggah gambar. Silakan coba lagi.` |
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Bukan admin | `Akses khusus admin. Anda tidak memiliki izin.` |

---

### `PATCH /api/products/:id`

Update produk (admin only). Mendukung upload gambar via multipart/form-data.

**Autentikasi**: adminOnly  
**Rate Limit**: 100 request/menit (default)  
**Content-Type**: `multipart/form-data` atau `application/json`

**Params:**

| Param | Tipe | Keterangan |
|---|---|---|
| `id` | string | ULID produk (26 karakter) |

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `name` | string | Tidak | Nama produk baru |
| `description` | string | Tidak | Deskripsi baru |
| `price` | number | Tidak | Harga baru (>= 0) |
| `stock` | number | Tidak | Stok baru (>= 0) |
| `category_id` | string | Tidak | ID kategori baru |
| `image_url` | string | Tidak | URL gambar baru |
| `image` | file | Tidak | File gambar baru untuk diupload |

> Jika name berubah, slug di-generate ulang.

**Contoh Request:**

```
PATCH /api/products/01HXYZ123456789ABCDEFGHIJR
Content-Type: multipart/form-data; boundary=----FormBoundary
Cookie: token=<admin-signed-token>

------FormBoundary
Content-Disposition: form-data; name="name"

Samsung Galaxy S24 Ultra (Updated)
------FormBoundary
Content-Disposition: form-data; name="stock"

25
------FormBoundary
Content-Disposition: form-data; name="image"; filename="galaxy-s24-new.jpg"
Content-Type: image/jpeg

<binary file content>
------FormBoundary--
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJR",
    "category_id": "01HXYZ123456789ABCDEFGHIJN",
    "name": "Samsung Galaxy S24 Ultra (Updated)",
    "slug": "samsung-galaxy-s24-ultra-updated",
    "description": "Smartphone Samsung terbaru",
    "price": "19999000.00",
    "stock": 25,
    "image_url": "https://ik.imagekit.io/xxx/galaxy-s24-new.jpg",
    "category": {
      "name": "Elektronik",
      "slug": "elektronik",
      "description": "Perangkat elektronik dan gadget"
    },
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 400 | Upload gagal | `Gagal mengunggah gambar. Silakan coba lagi.` |
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Bukan admin | `Akses khusus admin. Anda tidak memiliki izin.` |
| 404 | Produk tidak ditemukan | `Produk tidak ditemukan.` |

---

### `DELETE /api/products/:id`

Hapus produk (admin only).

**Autentikasi**: adminOnly  
**Rate Limit**: 100 request/menit (default)

**Params:**

| Param | Tipe | Keterangan |
|---|---|---|
| `id` | string | ULID produk (26 karakter) |

**Contoh Request:**

```json
DELETE /api/products/01HXYZ123456789ABCDEFGHIJR
Cookie: token=<admin-signed-token>
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "success": true
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Bukan admin | `Akses khusus admin. Anda tidak memiliki izin.` |

---

## Carts Module

Prefix: `/api/carts`

> **Catatan**: Semua endpoint di module ini memerlukan autentikasi (module-level hook `authenticate`).

---

### `GET /api/carts/`

Mendapatkan keranjang belanja user yang sedang login.

**Autentikasi**: authenticate  
**Rate Limit**: 100 request/menit (default)

**Request:** Tidak ada params, body, atau query

**Contoh Request:**

```json
GET /api/carts/
Cookie: token=<signed-token>
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJS",
    "user_id": "01HXYZ123456789ABCDEFGHIJKLM",
    "items": [
      {
        "id": "01HXYZ123456789ABCDEFGHIJT",
        "cart_id": "01HXYZ123456789ABCDEFGHIJS",
        "product_id": "01HXYZ123456789ABCDEFGHIJQ",
        "quantity": 2,
        "product": {
          "name": "iPhone 15 Pro Max",
          "price": "18999000.00",
          "image_url": "https://ik.imagekit.io/xxx/iphone15.jpg"
        }
      },
      {
        "id": "01HXYZ123456789ABCDEFGHIJU",
        "cart_id": "01HXYZ123456789ABCDEFGHIJS",
        "product_id": "01HXYZ123456789ABCDEFGHIJR",
        "quantity": 1,
        "product": {
          "name": "Samsung Galaxy S24 Ultra",
          "price": "19999000.00",
          "image_url": "https://ik.imagekit.io/xxx/galaxy-s24.jpg"
        }
      }
    ]
  }
}
```

> Catatan: Jika keranjang kosong, `items` akan berisi array kosong `[]`.

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |

---

### `POST /api/carts/items`

Menambahkan produk ke keranjang.

**Autentikasi**: authenticate  
**Rate Limit**: 100 request/menit (default)

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `product_id` | string | Ya | ID produk (ULID) |
| `quantity` | number | Ya | Jumlah (minimal 1) |

**Contoh Request:**

```json
POST /api/carts/items
Content-Type: application/json
Cookie: token=<signed-token>

{
  "product_id": "01HXYZ123456789ABCDEFGHIJQ",
  "quantity": 2
}
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJS",
    "user_id": "01HXYZ123456789ABCDEFGHIJKLM",
    "items": [
      {
        "id": "01HXYZ123456789ABCDEFGHIJT",
        "cart_id": "01HXYZ123456789ABCDEFGHIJS",
        "product_id": "01HXYZ123456789ABCDEFGHIJQ",
        "quantity": 2,
        "product": {
          "name": "iPhone 15 Pro Max",
          "price": "18999000.00",
          "image_url": "https://ik.imagekit.io/xxx/iphone15.jpg"
        }
      }
    ]
  }
}
```

> Catatan: Jika produk sudah ada di keranjang, quantity di-increase.

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |

---

### `PUT /api/carts/items/:itemId`

Update quantity item di keranjang.

**Autentikasi**: authenticate  
**Rate Limit**: 100 request/menit (default)

**Params:**

| Param | Tipe | Keterangan |
|---|---|---|
| `itemId` | string | ULID cart item (26 karakter) |

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `quantity` | number | Ya | Jumlah baru (minimal 1) |

**Contoh Request:**

```json
PUT /api/carts/items/01HXYZ123456789ABCDEFGHIJT
Content-Type: application/json
Cookie: token=<signed-token>

{
  "quantity": 5
}
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJS",
    "user_id": "01HXYZ123456789ABCDEFGHIJKLM",
    "items": [
      {
        "id": "01HXYZ123456789ABCDEFGHIJT",
        "cart_id": "01HXYZ123456789ABCDEFGHIJS",
        "product_id": "01HXYZ123456789ABCDEFGHIJQ",
        "quantity": 5,
        "product": {
          "name": "iPhone 15 Pro Max",
          "price": "18999000.00",
          "image_url": "https://ik.imagekit.io/xxx/iphone15.jpg"
        }
      }
    ]
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 404 | Item tidak ditemukan | `Item keranjang tidak ditemukan.` |

---

### `DELETE /api/carts/items/:itemId`

Hapus item dari keranjang.

**Autentikasi**: authenticate  
**Rate Limit**: 100 request/menit (default)

**Params:**

| Param | Tipe | Keterangan |
|---|---|---|
| `itemId` | string | ULID cart item (26 karakter) |

**Contoh Request:**

```json
DELETE /api/carts/items/01HXYZ123456789ABCDEFGHIJT
Cookie: token=<signed-token>
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJS",
    "user_id": "01HXYZ123456789ABCDEFGHIJKLM",
    "items": []
  }
}
```

> Catatan: Response berisi keranjang yang sudah diupdate (tanpa item yang dihapus).

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 404 | Item tidak ditemukan | `Item keranjang tidak ditemukan.` |

---

## Orders Module

Prefix: `/api/orders`

> **Catatan**: Semua endpoint di module ini memerlukan autentikasi (module-level hook `authenticate`). Endpoint tertentu memerlukan adminOnly.

---

### `GET /api/orders/report`

Mendapatkan laporan order harian (admin only).

**Autentikasi**: adminOnly  
**Rate Limit**: 100 request/menit (default)

**Query Params:**

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `start_date` | string | tanggal 1 bulan berjalan | Format: `YYYY-MM-DD` |
| `end_date` | string | akhir bulan berjalan | Format: `YYYY-MM-DD` |

**Contoh Request:**

```json
GET /api/orders/report?start_date=2026-01-01&end_date=2026-01-31
Cookie: token=<admin-signed-token>
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": [
    {
      "date": "2026-01-15",
      "total_amount": 45000000,
      "order_count": 3
    },
    {
      "date": "2026-01-16",
      "total_amount": 25000000,
      "order_count": 2
    }
  ]
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Bukan admin | `Akses khusus admin. Anda tidak memiliki izin.` |

---

### `POST /api/orders/`

Checkout dari keranjang dan buat order baru.

**Autentikasi**: authenticate  
**Rate Limit**: 100 request/menit (default)

**Request Body:** Tidak ada (order dibuat dari isi keranjang)

**Contoh Request:**

```json
POST /api/orders/
Cookie: token=<signed-token>
```

**Response 201 Success:**

```json
{
  "metadata": {
    "code": 201,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJV",
    "user_id": "01HXYZ123456789ABCDEFGHIJKLM",
    "total_amount": "38998000.00",
    "status": "pending",
    "created_at": "2026-01-15T10:30:00.000Z",
    "items": [
      {
        "id": "01HXYZ123456789ABCDEFGHIJW",
        "order_id": "01HXYZ123456789ABCDEFGHIJV",
        "product_id": "01HXYZ123456789ABCDEFGHIJQ",
        "quantity": 2,
        "price_at_purchase": "18999000.00",
        "product": {
          "name": "iPhone 15 Pro Max"
        }
      }
    ]
  }
}
```

> Catatan: Keranjang user dikosongkan setelah checkout berhasil.

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 400 | Keranjang kosong | `Keranjang belanja masih kosong. Tambahkan produk terlebih dahulu.` |
| 400 | Stok tidak mencukupi | `Stok <name> tidak mencukupi. Tersedia: <n>, diminta: <n>.` |
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |

---

### `GET /api/orders/me`

Mendapatkan daftar order user yang sedang login.

**Autentikasi**: authenticate  
**Rate Limit**: 100 request/menit (default)

**Query Params:**

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `page` | number | `1` | Nomor halaman |
| `limit` | number | `20` | Item per halaman |
| `sort` | string | `desc` | Urutan sort berdasarkan `created_at`. Nilai: `asc` (terlama dulu) atau `desc` (terbaru dulu) |
| `status` | string | - | Filter berdasarkan status order: `pending`, `shipped`, `delivered`, `cancelled` |

**Contoh Request:**

```json
GET /api/orders/me?page=1&limit=10&sort=asc&status=pending
Cookie: token=<signed-token>
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "data": [
      {
        "id": "01HXYZ123456789ABCDEFGHIJV",
        "user_id": "01HXYZ123456789ABCDEFGHIJKLM",
        "total_amount": "38998000.00",
        "status": "pending",
        "created_at": "2026-01-15T10:30:00.000Z",
        "items": [
          {
            "id": "01HXYZ123456789ABCDEFGHIJW",
            "order_id": "01HXYZ123456789ABCDEFGHIJV",
            "product_id": "01HXYZ123456789ABCDEFGHIJQ",
            "quantity": 2,
            "price_at_purchase": "18999000.00",
            "product": {
              "name": "iPhone 15 Pro Max"
            }
          }
        ]
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "total_pages": 1
    }
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |

---

### `GET /api/orders/:id`

Mendapatkan detail order berdasarkan ID.

**Autentikasi**: authenticate  
**Rate Limit**: 100 request/menit (default)  
**Otorisasi**: User biasa hanya bisa melihat order milik sendiri. Admin bisa melihat semua order.

**Params:**

| Param | Tipe | Keterangan |
|---|---|---|
| `id` | string | ULID order (26 karakter) |

**Contoh Request:**

```json
GET /api/orders/01HXYZ123456789ABCDEFGHIJV
Cookie: token=<signed-token>
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJV",
    "user_id": "01HXYZ123456789ABCDEFGHIJKLM",
    "total_amount": "38998000.00",
    "status": "pending",
    "created_at": "2026-01-15T10:30:00.000Z",
    "items": [
      {
        "id": "01HXYZ123456789ABCDEFGHIJW",
        "order_id": "01HXYZ123456789ABCDEFGHIJV",
        "product_id": "01HXYZ123456789ABCDEFGHIJQ",
        "quantity": 2,
        "price_at_purchase": "18999000.00",
        "product": {
          "name": "iPhone 15 Pro Max"
        }
      }
    ]
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Akses order user lain (non-admin) | `Anda tidak memiliki akses ke pesanan ini.` |
| 404 | Order tidak ditemukan | `Pesanan tidak ditemukan.` |

---

### `GET /api/orders/`

Mendapatkan daftar semua order (admin only, dengan pagination).

**Autentikasi**: adminOnly  
**Rate Limit**: 100 request/menit (default)

**Query Params:**

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `page` | number | `1` | Nomor halaman |
| `limit` | number | `20` | Item per halaman |
| `sort` | string | `desc` | Urutan sort berdasarkan `created_at`. Nilai: `asc` (terlama dulu) atau `desc` (terbaru dulu) |
| `status` | string | - | Filter berdasarkan status order: `pending`, `shipped`, `delivered`, `cancelled` |

**Contoh Request:**

```json
GET /api/orders/?page=1&limit=10&status=pending
Cookie: token=<admin-signed-token>
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "data": [
      {
        "id": "01HXYZ123456789ABCDEFGHIJV",
        "user_id": "01HXYZ123456789ABCDEFGHIJKLM",
        "total_amount": "38998000.00",
        "status": "pending",
        "created_at": "2026-01-15T10:30:00.000Z",
        "items": [
          {
            "id": "01HXYZ123456789ABCDEFGHIJW",
            "order_id": "01HXYZ123456789ABCDEFGHIJV",
            "product_id": "01HXYZ123456789ABCDEFGHIJQ",
            "quantity": 2,
            "price_at_purchase": "18999000.00",
            "product": {
              "name": "iPhone 15 Pro Max"
            }
          }
        ]
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "total_pages": 1
    }
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Bukan admin | `Akses khusus admin. Anda tidak memiliki izin.` |

---

### `PATCH /api/orders/:id/status`

Update status order (admin only).

**Autentikasi**: adminOnly  
**Rate Limit**: 100 request/menit (default)

**Params:**

| Param | Tipe | Keterangan |
|---|---|---|
| `id` | string | ULID order (26 karakter) |

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `status` | string | Ya | Status baru. Nilai: `"pending"`, `"shipped"`, `"delivered"`, `"cancelled"` |

**Status Order:**

| Status | Keterangan |
|---|---|
| `pending` | Order baru, menunggu diproses |
| `shipped` | Order sudah dikirim |
| `delivered` | Order sudah diterima |
| `cancelled` | Order dibatalkan |

**Contoh Request:**

```json
PATCH /api/orders/01HXYZ123456789ABCDEFGHIJV/status
Content-Type: application/json
Cookie: token=<admin-signed-token>

{
  "status": "shipped"
}
```

**Response 200 Success:**

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HXYZ123456789ABCDEFGHIJV",
    "user_id": "01HXYZ123456789ABCDEFGHIJKLM",
    "total_amount": "38998000.00",
    "status": "shipped",
    "created_at": "2026-01-15T10:30:00.000Z",
    "items": [
      {
        "id": "01HXYZ123456789ABCDEFGHIJW",
        "order_id": "01HXYZ123456789ABCDEFGHIJV",
        "product_id": "01HXYZ123456789ABCDEFGHIJQ",
        "quantity": 2,
        "price_at_purchase": "18999000.00",
        "product": {
          "name": "iPhone 15 Pro Max"
        }
      }
    ]
  }
}
```

**Error:**

| Code | Kondisi | Message |
|---|---|---|
| 400 | Status tidak valid (validasi enum schema) | `Data yang dikirim tidak valid. Periksa kembali isian Anda.` |
| 401 | Token tidak ada/invalid | `Sesi berakhir. Silakan login kembali.` |
| 403 | Bukan admin | `Akses khusus admin. Anda tidak memiliki izin.` |
