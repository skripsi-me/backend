# API Reference — Backend E-Commerce

Dokumentasi lengkap semua endpoint API untuk keperluan integrasi frontend.

---

## Daftar Isi

1. [Base URL & Server](#base-url--server)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Data Models](#data-models)
7. [Auth Module](#auth-module)
8. [Users Module](#users-module)
9. [Categories Module](#categories-module)
10. [Products Module](#products-module)
11. [Carts Module](#carts-module)
12. [Orders Module](#orders-module)

---

## Base URL & Server

| Item | Nilai |
|------|-------|
| Base URL | `http://localhost:3000` |
| API Prefix | Semua endpoint diawali `/api` |
| Content-Type | `application/json` |
| Swagger UI | `http://localhost:3000/docs` |

---

## Authentication

### Mekanisme

Autentikasi menggunakan **JWT yang disimpan di HttpOnly signed cookies**.

| Cookie | Fungsi | Masa Berlaku | Path |
|--------|--------|--------------|------|
| `token` | Access token | 15 menit | `/` |
| `refresh_token` | Refresh token | 7 hari | `/api/auth/refresh` |

### Cara Kerja

1. **Login** → Server mengatur cookie `token` dan `refresh_token` secara otomatis
2. **Akses endpoint auth** → Sertakan cookie dalam request (browser mengirim otomatis)
3. **Token kedaluwarsa** → Panggil `/api/auth/refresh` untuk mendapatkan access token baru
4. **Logout** → Cookie dihapus oleh server

### Untuk Frontend (fetch/axios)

```javascript
// Saat login, pastikan credentials diizinkan
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  credentials: 'include', // penting untuk mengirim/menerima cookie
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// Setelah login, cookie dikirim otomatis di request berikutnya
const profile = await fetch('http://localhost:3000/api/users/me', {
  credentials: 'include'
});
```

### Role-based Access

| Guard | Keterangan |
|-------|-----------|
| Public | Tidak perlu autentikasi |
| Authenticated | Perlu cookie `token` yang valid |
| Admin | Perlu cookie `token` dengan `role: "admin"` |

---

## Response Format

### Response Standar

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": { }
}
```

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `metadata.code` | number | HTTP status code |
| `metadata.message` | string | Deskripsi singkat |
| `data` | any | Hasil operasi (ada saat sukses) |
| `error` | object | Detail error per field (ada saat validasi gagal) |

### Response Error (Validasi)

```json
{
  "metadata": {
    "code": 400,
    "message": "Validation Error"
  },
  "error": {
    "email": "Invalid email format",
    "password": "String must have at least 8 characters"
  }
}
```

---

## Error Handling

### Semua Kemungkinan Error

| Code | Keterangan | Kapan Terjadi |
|------|-----------|---------------|
| 400 | Bad Request | Validasi gagal, data tidak lengkap, atau bisnis error |
| 401 | Unauthorized | Token tidak ada, tidak valid, atau kedaluwarsa |
| 403 | Forbidden | Bukan admin saat akses endpoint admin |
| 404 | Not Found | Resource tidak ditemukan |
| 409 | Conflict | Data sudah ada (contoh: email duplikat) |
| 429 | Too Many Requests | Melebihi rate limit (20 req/detik) |
| 500 | Internal Server Error | Error tak terduga di server |

### Cara Menangani di Frontend

```javascript
try {
  const response = await fetch(url, options);
  const result = await response.json();

  if (!response.ok) {
    // Handle error berdasarkan code
    switch (result.metadata?.code) {
      case 401:
        // Token expired → coba refresh
        await fetch('http://localhost:3000/api/auth/refresh', { credentials: 'include' });
        break;
      case 403:
        // Tidak punya akses
        break;
      case 409:
        // Data duplikat
        break;
      default:
        // Error lainnya
    }
  }
} catch (error) {
  // Network error
}
```

---

## Rate Limiting

| Item | Nilai |
|------|-------|
| Batas | 20 request per detik per IP |
| Response | `429 Too Many Requests` |

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Maximum 20 requests per 1000ms allowed."
}
```

---

## Data Models

### User

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | ULID (26 karakter), unique identifier |
| `email` | string | Email unik |
| `name` | string | Nama lengkap |
| `address` | string \| null | Alamat fisik |
| `phone_number` | string \| null | Nomor telepon |
| `role` | string | `"user"` atau `"admin"` |

### Category

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | ULID |
| `name` | string | Nama kategori |
| `slug` | string | URL-friendly name (unique) |
| `description` | string \| null | Deskripsi kategori |
| `created_at` | string (ISO) | Waktu pembuatan |
| `updated_at` | string (ISO) | Waktu update terakhir |

### Product

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | ULID |
| `category_id` | string \| null | ULID kategori |
| `name` | string | Nama produk |
| `slug` | string | URL-friendly name (unique) |
| `description` | string \| null | Deskripsi produk |
| `price` | string | Harga (decimal string, contoh: `"999.00"`) |
| `stock` | number | Stok tersedia |
| `image_url` | string \| null | URL gambar produk |
| `category` | object \| null | Info kategori (lihat di bawah) |
| `created_at` | string (ISO) | Waktu pembuatan |
| `updated_at` | string (ISO) | Waktu update terakhir |

**Object `category` (nested):**

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `name` | string | Nama kategori |
| `slug` | string | Slug kategori |
| `description` | string \| null | Deskripsi kategori |

**Product dengan `total_sold` (best sellers):**

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `total_sold` | number | Total quantity terjual |

### Cart

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | ULID |
| `user_id` | string | ULID pemilik |
| `items` | array | Daftar item di keranjang |

**Object `items[]`:**

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | ULID cart item |
| `cart_id` | string | ULID cart induk |
| `product_id` | string | ULID produk |
| `quantity` | number | Jumlah item |
| `product` | object | Info produk |

**Object `product` (nested di cart item):**

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `name` | string | Nama produk |
| `price` | string | Harga produk |
| `image_url` | string \| null | URL gambar |

### Order

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | ULID |
| `user_id` | string | ULID pembeli |
| `total_amount` | string | Total jumlah (decimal string) |
| `status` | string | Status pesanan |
| `created_at` | string (ISO) | Waktu pembuatan |
| `items` | array \| undefined | Daftar item (ada di detail, tidak ada di list) |

**Status yang valid:** `"pending"`, `"shipped"`, `"delivered"`, `"cancelled"`

**Object `items[]` (order items):**

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | ULID order item |
| `order_id` | string | ULID order induk |
| `product_id` | string | ULID produk |
| `quantity` | number | Jumlah yang dibeli |
| `price_at_purchase` | string | Harga saat pembelian |
| `product` | object | Info produk |

**Object `product` (nested di order item):**

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `name` | string | Nama produk |

### Order Report

| Field | Tipe | Keterangan |
|-------|------|-----------|
| `date` | string | Tanggal (format: `YYYY-MM-DD`) |
| `total_amount` | number | Total jumlah transaksi |
| `order_count` | number | Jumlah pesanan |

---

## Pagination

Beberapa endpoint mendukung pagination. Response menggunakan format:

```json
{
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "total_pages": 10
  }
}
```

| Query Param | Tipe | Default | Keterangan |
|-------------|------|---------|-----------|
| `page` | number | 1 | Nomor halaman (minimum: 1) |
| `limit` | number | 10 | Item per halaman (minimum: 1, maximum: 100) |

---

## Auth Module

### Register

`POST /api/auth/register`

**Request Body:**

| Field | Tipe | Wajib | Validasi |
|-------|------|-------|---------|
| `email` | string | Ya | Format email |
| `password` | string | Ya | Minimum 8 karakter |
| `name` | string | Ya | Minimum 1 karakter |
| `address` | string | Tidak | — |
| `phone_number` | string | Tidak | — |
| `role` | string | Tidak | `"user"` atau `"admin"` (default: `"user"`) |

**Response (201 Created):**
```json
{
  "metadata": { "code": 201, "message": "User registered successfully" },
  "data": {
    "id": "01HS1234567890ABCDEFGHJKLMN",
    "email": "user@example.com",
    "name": "John Doe",
    "address": "123 Street Name",
    "phone_number": "08123456789",
    "role": "user"
  }
}
```

**Error:**
- `409 Conflict` — Email sudah terdaftar

---

### Login

`POST /api/auth/login`

**Request Body:**

| Field | Tipe | Wajib | Validasi |
|-------|------|-------|---------|
| `email` | string | Ya | Format email |
| `password` | string | Ya | — |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Login successful" },
  "data": { "status": "ok" }
}
```

> Cookie `token` dan `refresh_token` diatur otomatis oleh server.

**Error:**
- `401 Unauthorized` — Email atau password salah

---

### Refresh Token

`POST /api/auth/refresh`

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Token refreshed" },
  "data": { "status": "ok" }
}
```

> Access token baru diatur di cookie `token`.

**Error:**
- `401 Unauthorized` — Refresh token tidak valid atau kedaluwarsa

---

### Change Password

`POST /api/auth/change-password`
*Authenticated*

**Request Body:**

| Field | Tipe | Wajib | Validasi |
|-------|------|-------|---------|
| `old_password` | string | Ya | — |
| `new_password` | string | Ya | Minimum 8 karakter |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Password changed successfully" },
  "data": { "status": "ok" }
}
```

**Error:**
- `401 Unauthorized` — Password lama salah

---

### Logout

`POST /api/auth/logout`
*Public*

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Logged out successfully" },
  "data": { "status": "ok" }
}
```

> Cookie `token` dan `refresh_token` dihapus.

---

## Users Module

### Get My Profile

`GET /api/users/me`
*Authenticated*

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": {
    "id": "01HS1234567890ABCDEFGHJKLMN",
    "email": "user@example.com",
    "name": "John Doe",
    "address": "123 Street Name",
    "phone_number": "08123456789",
    "role": "user"
  }
}
```

---

### Update My Profile

`PATCH /api/users/me`
*Authenticated*

**Request Body:**

| Field | Tipe | Wajib | Validasi |
|-------|------|-------|---------|
| `name` | string | Tidak | Minimum 1 karakter |
| `address` | string | Tidak | — |
| `phone_number` | string | Tidak | — |

> Semua field bersifat opsional.

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Profile updated successfully" },
  "data": {
    "id": "01HS1234567890ABCDEFGHJKLMN",
    "email": "user@example.com",
    "name": "John Updated",
    "address": "456 New Street",
    "phone_number": "08987654321",
    "role": "user"
  }
}
```

---

### Admin: List All Users

`GET /api/users`
*Admin only*

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": [
    {
      "id": "01HS1234567890ABCDEFGHJKLMN",
      "email": "user@example.com",
      "name": "John Doe",
      "address": "123 Street Name",
      "phone_number": "08123456789",
      "role": "user"
    }
  ]
}
```

---

### Admin: Get User by ID

`GET /api/users/:id`
*Admin only*

**Params:**

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | User ULID |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": {
    "id": "01HS1234567890ABCDEFGHJKLMN",
    "email": "user@example.com",
    "name": "John Doe",
    "address": "123 Street Name",
    "phone_number": "08123456789",
    "role": "user"
  }
}
```

---

### Admin: Create User

`POST /api/users`
*Admin only*

**Request Body:**

| Field | Tipe | Wajib | Validasi |
|-------|------|-------|---------|
| `email` | string | Ya | Format email |
| `password` | string | Ya | Minimum 8 karakter |
| `name` | string | Ya | Minimum 1 karakter |
| `address` | string | Tidak | — |
| `phone_number` | string | Tidak | — |
| `role` | string | Tidak | `"user"` atau `"admin"` (default: `"user"`) |

**Response (201 Created):**
```json
{
  "metadata": { "code": 201, "message": "Success" },
  "data": {
    "id": "01HS1234567890ABCDEFGHJKLMN",
    "email": "newuser@example.com",
    "name": "New User",
    "address": null,
    "phone_number": null,
    "role": "user"
  }
}
```

**Error:**
- `409 Conflict` — Email sudah terdaftar

---

### Admin: Update User

`PATCH /api/users/:id`
*Admin only*

**Params:**

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | User ULID |

**Request Body:**

| Field | Tipe | Wajib | Validasi |
|-------|------|-------|---------|
| `email` | string | Tidak | Format email |
| `password` | string | Tidak | Minimum 8 karakter |
| `name` | string | Tidak | Minimum 1 karakter |
| `address` | string | Tidak | — |
| `phone_number` | string | Tidak | — |
| `role` | string | Tidak | `"user"` atau `"admin"` |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": { ... }
}
```

**Error:**
- `409 Conflict` — Email sudah digunakan user lain

---

### Admin: Delete User

`DELETE /api/users/:id`
*Admin only*

**Params:**

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | User ULID |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": { "success": true }
}
```

---

## Categories Module

### List All Categories

`GET /api/categories`
*Public*

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": [
    {
      "id": "01HSX1ABCDEF23456789JKLMN",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Gadgets and devices",
      "created_at": "2026-03-20T10:00:00.000Z",
      "updated_at": "2026-03-20T10:00:00.000Z"
    }
  ]
}
```

---

### Get Category by Slug

`GET /api/categories/:slug`
*Public*

**Params:**

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `slug` | string | Category slug |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": {
    "id": "01HSX1ABCDEF23456789JKLMN",
    "name": "Electronics",
    "slug": "electronics",
    "description": "Gadgets and devices",
    "created_at": "2026-03-20T10:00:00.000Z",
    "updated_at": "2026-03-20T10:00:00.000Z"
  }
}
```

**Error:**
- `404 Not Found` — Kategori tidak ditemukan

---

### Admin: Create Category

`POST /api/categories`
*Admin only*

**Request Body:**

| Field | Tipe | Wajib | Validasi |
|-------|------|-------|---------|
| `name` | string | Ya | Minimum 1 karakter |
| `description` | string | Tidak | — |

> `slug` di-generate otomatis dari `name`.

**Response (201 Created):**
```json
{
  "metadata": { "code": 201, "message": "Success" },
  "data": {
    "id": "01HSX1ABCDEF23456789JKLMN",
    "name": "Electronics",
    "slug": "electronics",
    "description": "Gadgets and devices",
    "created_at": "2026-03-20T10:00:00.000Z",
    "updated_at": "2026-03-20T10:00:00.000Z"
  }
}
```

**Error:**
- `409 Conflict` — Nama kategori sudah ada

---

### Admin: Update Category

`PATCH /api/categories/:id`
*Admin only*

**Params:**

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | Category ULID |

**Request Body:**

| Field | Tipe | Wajib | Validasi |
|-------|------|-------|---------|
| `name` | string | Tidak | Minimum 1 karakter |
| `description` | string | Tidak | — |

> Jika `name` diupdate, `slug` otomatis ter-generate ulang.

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": { ... }
}
```

**Error:**
- `409 Conflict` — Nama kategori sudah ada

---

### Admin: Delete Category

`DELETE /api/categories/:id`
*Admin only*

**Params:**

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | Category ULID |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": { "success": true }
}
```

---

## Products Module

### List All Products

`GET /api/products`
*Public*

**Query Params:**

| Param | Tipe | Default | Keterangan |
|-------|------|---------|-----------|
| `page` | number | 1 | Nomor halaman |
| `limit` | number | 10 | Item per halaman (max: 100) |
| `search` | string | — | FULLTEXT search pada name & description |
| `category_id` | string | — | Filter berdasarkan kategori |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": {
    "data": [
      {
        "id": "01HSY1ABCDEF23456789JKLMN",
        "category_id": "01HSX1ABCDEF23456789JKLMN",
        "name": "Smartphone X",
        "slug": "smartphone-x",
        "description": "Latest smartphone",
        "price": "999.00",
        "stock": 50,
        "image_url": "https://example.com/image.jpg",
        "category": {
          "name": "Electronics",
          "slug": "electronics",
          "description": "Gadgets and devices"
        },
        "created_at": "2026-03-20T10:00:00.000Z",
        "updated_at": "2026-03-20T10:00:00.000Z"
      }
    ],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "total_pages": 10
    }
  }
}
```

---

### Get Best Sellers

`GET /api/products/best-sellers`
*Public*

**Query Params:**

| Param | Tipe | Default | Keterangan |
|-------|------|---------|-----------|
| `limit` | number | 5 | Jumlah produk (max: 50) |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": [
    {
      "id": "01HSY1ABCDEF23456789JKLMN",
      "category_id": "01HSX1ABCDEF23456789JKLMN",
      "name": "Smartphone X",
      "slug": "smartphone-x",
      "description": "Latest smartphone",
      "price": "999.00",
      "stock": 50,
      "image_url": "https://example.com/image.jpg",
      "category": {
        "name": "Electronics",
        "slug": "electronics",
        "description": "Gadgets and devices"
      },
      "created_at": "2026-03-20T10:00:00.000Z",
      "updated_at": "2026-03-20T10:00:00.000Z",
      "total_sold": 150
    }
  ]
}
```

---

### Get Product by Slug

`GET /api/products/slug/:slug`
*Public*

**Params:**

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `slug` | string | Product slug |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": {
    "id": "01HSY1ABCDEF23456789JKLMN",
    "category_id": "01HSX1ABCDEF23456789JKLMN",
    "name": "Smartphone X",
    "slug": "smartphone-x",
    "description": "Latest smartphone",
    "price": "999.00",
    "stock": 50,
    "image_url": "https://example.com/image.jpg",
    "category": {
      "name": "Electronics",
      "slug": "electronics",
      "description": "Gadgets and devices"
    },
    "created_at": "2026-03-20T10:00:00.000Z",
    "updated_at": "2026-03-20T10:00:00.000Z"
  }
}
```

**Error:**
- `404 Not Found` — Produk tidak ditemukan

---

### List Products by Category

`GET /api/products/category/:categorySlug`
*Public*

**Params:**

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `categorySlug` | string | Category slug |

**Query Params:**

| Param | Tipe | Default | Keterangan |
|-------|------|---------|-----------|
| `page` | number | 1 | Nomor halaman |
| `limit` | number | 10 | Item per halaman |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": {
    "data": [ ... ],
    "meta": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "total_pages": 3
    }
  }
}
```

**Error:**
- `404 Not Found` — Kategori tidak ditemukan

---

### Admin: Get Product by ID

`GET /api/products/:id`
*Admin only*

**Params:**

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | Product ULID |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": { ... }
}
```

---

### Admin: Create Product

`POST /api/products`
*Admin only*

**Request Body:**

| Field | Tipe | Wajib | Validasi |
|-------|------|-------|---------|
| `name` | string | Ya | Minimum 1 karakter |
| `description` | string | Tidak | — |
| `price` | number | Ya | Minimum 0 |
| `stock` | number | Ya | Minimum 0 |
| `category_id` | string | Ya | Category ULID yang valid |
| `image_url` | string \| null | Tidak | URL gambar produk |

> `slug` di-generate otomatis dari `name`.

**Response (201 Created):**
```json
{
  "metadata": { "code": 201, "message": "Success" },
  "data": {
    "id": "01HSY1ABCDEF23456789JKLMN",
    "category_id": "01HSX1ABCDEF23456789JKLMN",
    "name": "Smartphone X",
    "slug": "smartphone-x",
    "description": "Latest smartphone",
    "price": "999.00",
    "stock": 50,
    "image_url": "https://example.com/image.jpg",
    "category": {
      "name": "Electronics",
      "slug": "electronics",
      "description": "Gadgets and devices"
    },
    "created_at": "2026-03-20T10:00:00.000Z",
    "updated_at": "2026-03-20T10:00:00.000Z"
  }
}
```

**Error:**
- `409 Conflict` — Nama produk sudah ada

---

### Admin: Update Product

`PATCH /api/products/:id`
*Admin only*

**Params:**

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | Product ULID |

**Request Body:**

| Field | Tipe | Wajib | Validasi |
|-------|------|-------|---------|
| `name` | string | Tidak | Minimum 1 karakter |
| `description` | string | Tidak | — |
| `price` | number | Tidak | Minimum 0 |
| `stock` | number | Tidak | Minimum 0 |
| `category_id` | string | Tidak | Category ULID yang valid |
| `image_url` | string \| null | Tidak | URL gambar produk |

> Jika `name` diupdate, `slug` otomatis ter-generate ulang.

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": { ... }
}
```

**Error:**
- `409 Conflict` — Nama produk sudah ada

---

### Admin: Delete Product

`DELETE /api/products/:id`
*Admin only*

**Params:**

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | Product ULID |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": { "success": true }
}
```

---

## Carts Module

> Semua endpoint modul ini membutuhkan autentikasi.

### Get My Cart

`GET /api/carts`
*Authenticated*

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": {
    "id": "01HSZ1ABCDEF23456789JKLMN",
    "user_id": "01HS1234567890ABCDEFGHJKLMN",
    "items": [
      {
        "id": "01HSZ2ABCDEF23456789JKLMN",
        "cart_id": "01HSZ1ABCDEF23456789JKLMN",
        "product_id": "01HSY1ABCDEF23456789JKLMN",
        "quantity": 2,
        "product": {
          "name": "Smartphone X",
          "price": "999.00",
          "image_url": "https://example.com/image.jpg"
        }
      }
    ]
  }
}
```

> Jika keranjang kosong, `items` akan berisi array kosong `[]`.

---

### Add Item to Cart

`POST /api/carts/items`
*Authenticated*

**Request Body:**

| Field | Tipe | Wajib | Validasi |
|-------|------|-------|---------|
| `product_id` | string | Ya | Product ULID |
| `quantity` | number | Ya | Minimum 1 |

> Jika produk sudah ada di keranjang, quantity akan ditambahkan.

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": {
    "id": "01HSZ1ABCDEF23456789JKLMN",
    "user_id": "01HS1234567890ABCDEFGHJKLMN",
    "items": [ ... ]
  }
}
```

**Error:**
- `404 Not Found` — Produk tidak ditemukan
- `400 Bad Request` — Stok tidak mencukupi

---

### Update Cart Item Quantity

`PUT /api/carts/items/:itemId`
*Authenticated*

**Params:**

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `itemId` | string | Cart item ULID |

**Request Body:**

| Field | Tipe | Wajib | Validasi |
|-------|------|-------|---------|
| `quantity` | number | Ya | Minimum 1 |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": { ... }
}
```

**Error:**
- `400 Bad Request` — Stok tidak mencukupi

---

### Remove Cart Item

`DELETE /api/carts/items/:itemId`
*Authenticated*

**Params:**

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `itemId` | string | Cart item ULID |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": { ... }
}
```

---

## Orders Module

> Semua endpoint modul ini membutuhkan autentikasi.

### Create Order (Checkout)

`POST /api/orders`
*Authenticated*

> Mengkonversi semua item di keranjang menjadi pesanan. Stok produk akan dikurangi. Keranjang akan dikosongkan. Tidak perlu request body.

**Response (201 Created):**
```json
{
  "metadata": { "code": 201, "message": "Success" },
  "data": {
    "id": "01HT1ABCDEF23456789JKLMN",
    "user_id": "01HS1234567890ABCDEFGHJKLMN",
    "total_amount": "1998.00",
    "status": "pending",
    "created_at": "2026-03-20T10:00:00.000Z",
    "items": [
      {
        "id": "01HT2ABCDEF23456789JKLMN",
        "order_id": "01HT1ABCDEF23456789JKLMN",
        "product_id": "01HSY1ABCDEF23456789JKLMN",
        "quantity": 2,
        "price_at_purchase": "999.00",
        "product": {
          "name": "Smartphone X"
        }
      }
    ]
  }
}
```

**Error:**
- `400 Bad Request` — Cart is empty

---

### Get My Orders

`GET /api/orders/me`
*Authenticated*

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": [
    {
      "id": "01HT1ABCDEF23456789JKLMN",
      "user_id": "01HS1234567890ABCDEFGHJKLMN",
      "total_amount": "1998.00",
      "status": "pending",
      "created_at": "2026-03-20T10:00:00.000Z"
    }
  ]
}
```

> Response list tidak menyertakan `items`. Untuk detail, gunakan endpoint get by ID.

---

### Get Order by ID

`GET /api/orders/:id`
*Authenticated*

**Params:**

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | Order ULID |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": {
    "id": "01HT1ABCDEF23456789JKLMN",
    "user_id": "01HS1234567890ABCDEFGHJKLMN",
    "total_amount": "1998.00",
    "status": "pending",
    "created_at": "2026-03-20T10:00:00.000Z",
    "items": [
      {
        "id": "01HT2ABCDEF23456789JKLMN",
        "order_id": "01HT1ABCDEF23456789JKLMN",
        "product_id": "01HSY1ABCDEF23456789JKLMN",
        "quantity": 2,
        "price_at_purchase": "999.00",
        "product": {
          "name": "Smartphone X"
        }
      }
    ]
  }
}
```

> User hanya bisa melihat pesanan sendiri. Admin bisa melihat semua.

**Error:**
- `404 Not Found` — Pesanan tidak ditemukan

---

### Admin: List All Orders

`GET /api/orders`
*Admin only*

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": [
    {
      "id": "01HT1ABCDEF23456789JKLMN",
      "user_id": "01HS1234567890ABCDEFGHJKLMN",
      "total_amount": "1998.00",
      "status": "pending",
      "created_at": "2026-03-20T10:00:00.000Z",
      "user": {
        "email": "user@example.com"
      }
    }
  ]
}
```

---

### Admin: Update Order Status

`PATCH /api/orders/:id/status`
*Admin only*

**Params:**

| Param | Tipe | Keterangan |
|-------|------|-----------|
| `id` | string | Order ULID |

**Request Body:**

| Field | Tipe | Wajib | Nilai yang Valid |
|-------|------|-------|-----------------|
| `status` | string | Ya | `"pending"`, `"shipped"`, `"delivered"`, `"cancelled"` |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": { ... }
}
```

---

### Admin: Get Order Report

`GET /api/orders/report`
*Admin only*

**Query Params:**

| Param | Tipe | Default | Keterangan |
|-------|------|---------|-----------|
| `start_date` | string | 1 bulan lalu | Format: `YYYY-MM-DD` |
| `end_date` | string | hari ini | Format: `YYYY-MM-DD` |

**Response (200 OK):**
```json
{
  "metadata": { "code": 200, "message": "Success" },
  "data": [
    {
      "date": "2026-03-20",
      "total_amount": 5000.00,
      "order_count": 10
    },
    {
      "date": "2026-03-21",
      "total_amount": 3500.00,
      "order_count": 7
    }
  ]
}
```

---

## CORS Configuration

| Item | Nilai |
|------|-------|
| Origin | Semua (`origin: true`) |
| Credentials | Diizinkan (`credentials: true`) |
| Methods | `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` |

> Untuk production, `origin` harus dibatasi ke domain tertentu.

---

## Contoh Frontend Integration

### Login & Ambil Profile

```javascript
// Login
await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

// Ambil profile (cookie dikirim otomatis)
const profileRes = await fetch('http://localhost:3000/api/users/me', {
  credentials: 'include'
});
const { data: profile } = await profileRes.json();
```

### List Products dengan Search & Pagination

```javascript
const params = new URLSearchParams({
  page: '1',
  limit: '10',
  search: 'phone',
  category_id: '01HSX1ABCDEF23456789JKLMN'
});

const res = await fetch(`http://localhost:3000/api/products?${params}`, {
  credentials: 'include'
});
const { data } = await res.json();
// data.data = array produk
// data.meta = { total, page, limit, total_pages }
```

### Tambah ke Cart

```javascript
await fetch('http://localhost:3000/api/carts/items', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    product_id: '01HSY1ABCDEF23456789JKLMN',
    quantity: 2
  })
});
```

### Checkout

```javascript
const res = await fetch('http://localhost:3000/api/orders', {
  method: 'POST',
  credentials: 'include'
});
const { data: order } = await res.json();
// order.items = array order items
// order.total_amount = total pembayaran
```

### Handle Token Expired

```javascript
async function apiCall(url, options = {}) {
  let res = await fetch(url, { ...options, credentials: 'include' });

  if (res.status === 401) {
    // Coba refresh token
    const refreshRes = await fetch('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });

    if (refreshRes.ok) {
      // Retry original request
      res = await fetch(url, { ...options, credentials: 'include' });
    } else {
      // Redirect ke login
      window.location.href = '/login';
    }
  }

  return res;
}
```
