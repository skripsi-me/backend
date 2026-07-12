# Contoh Request & Response API

Dokumentasi ini berisi contoh request dan response untuk semua endpoint. Semua response mengikuti format standar.

## Format Response Standar

```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {},
  "error": {}
}
```

- `data` berisi hasil operasi (ada saat sukses)
- `error` berisi error per field (ada saat error validasi)

## Cara Menggunakan Autentikasi

Semua endpoint yang membutuhkan autentikasi menggunakan **HttpOnly signed cookies**. Cookie diatur secara otomatis setelah login.

```
Cookie: token=<jwt_access_token>; refresh_token=<jwt_refresh_token>
```

- **Access token** (`token`): berlaku 15 menit, path `/`
- **Refresh token** (`refresh_token`): berlaku 7 hari, path `/api/auth/refresh`

Untuk endpoint yang membutuhkan autentikasi, sertakan cookie dalam request. Cookie diatur otomatis oleh browser setelah login.

---

## Contoh Error Response

### 400 — Validasi Error

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

### 401 — Unauthorized

```json
{
  "metadata": {
    "code": 401,
    "message": "Invalid or missing token"
  }
}
```

### 403 — Forbidden

```json
{
  "metadata": {
    "code": 403,
    "message": "Admin access required"
  }
}
```

### 404 — Not Found

```json
{
  "metadata": {
    "code": 404,
    "message": "User not found"
  }
}
```

### 409 — Conflict

```json
{
  "metadata": {
    "code": 409,
    "message": "Email already exists"
  }
}
```

### 429 — Rate Limit

```json
{
  "metadata": {
    "code": 429,
    "message": "Rate limit exceeded"
  }
}
```

### 500 — Internal Server Error

```json
{
  "metadata": {
    "code": 500,
    "message": "Internal Server Error"
  }
}
```

---

## Auth Module (`/api/auth`)

### Register

`POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "address": "123 Street Name",
  "phone_number": "08123456789"
}
```

> `address` dan `phone_number` bersifat opsional.

**Response (201 Created):**
```json
{
  "metadata": {
    "code": 201,
    "message": "User registered successfully"
  },
  "data": {
    "id": "01HS1234567890ABCDEFGHJKLMN",
    "email": "user@example.com",
    "name": "John Doe",
    "address": "123 Street Name",
    "phone_number": "08123456789",
    "role": "user",
    "created_at": "2026-03-20T10:00:00.000Z",
    "updated_at": "2026-03-20T10:00:00.000Z"
  }
}
```

### Login

`POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Login successful"
  },
  "data": {
    "status": "ok"
  }
}
```

> Cookie `token` (access) dan `refresh_token` diatur otomatis.

### Refresh Token

`POST /api/auth/refresh`

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Token refreshed"
  },
  "data": {
    "status": "ok"
  }
}
```

> Access token baru diatur di cookie.

### Change Password

`POST /api/auth/change-password`
*Membutuhkan autentikasi*

**Request Body:**
```json
{
  "old_password": "oldPassword123",
  "new_password": "newPassword456"
}
```

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Password changed successfully"
  },
  "data": {
    "status": "ok"
  }
}
```

### Logout

`POST /api/auth/logout`
*Public*

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Logged out successfully"
  },
  "data": {
    "status": "ok"
  }
}
```

> Cookie `token` dan `refresh_token` dihapus.

---

## Users Module (`/api/users`)

> Semua endpoint modul ini membutuhkan autentikasi.

### Get My Profile

`GET /api/users/me`

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Profile retrieved successfully"
  },
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

### Update My Profile

`PATCH /api/users/me`

**Request Body:**
```json
{
  "name": "John Updated",
  "address": "456 New Street",
  "phone_number": "08987654321"
}
```

> Semua field bersifat opsional.

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Profile updated successfully"
  },
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

### Admin: List All Users

`GET /api/users`
*Membutuhkan role admin*

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Users retrieved successfully"
  },
  "data": [
    {
      "id": "01HS1234567890ABCDEFGHJKLMN",
      "email": "user@example.com",
      "name": "John Doe",
      "address": "123 Street Name",
      "phone_number": "08123456789",
      "role": "user"
    },
    {
      "id": "01HS1234567890ABCDEFGHJKLMO",
      "email": "admin@example.com",
      "name": "Admin User",
      "address": null,
      "phone_number": null,
      "role": "admin"
    }
  ]
}
```

### Admin: Get User by ID

`GET /api/users/:id`
*Membutuhkan role admin*

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "User retrieved successfully"
  },
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

**Response (404 Not Found):**
```json
{
  "metadata": {
    "code": 404,
    "message": "User not found"
  }
}
```

### Admin: Create User

`POST /api/users`
*Membutuhkan role admin*

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "role": "user"
}
```

> `role` bersifat opsional, default: `"user"`.

**Response (201 Created):**
```json
{
  "metadata": {
    "code": 201,
    "message": "User created successfully"
  },
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

**Response (409 Conflict):**
```json
{
  "metadata": {
    "code": 409,
    "message": "Email already exists"
  }
}
```

### Admin: Update User

`PATCH /api/users/:id`
*Membutuhkan role admin*

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "admin"
}
```

> Semua field bersifat opsional. Password juga bisa diupdate.

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "User updated successfully"
  },
  "data": {
    "id": "01HS1234567890ABCDEFGHJKLMN",
    "email": "user@example.com",
    "name": "Updated Name",
    "address": "123 Street Name",
    "phone_number": "08123456789",
    "role": "admin"
  }
}
```

### Admin: Delete User

`DELETE /api/users/:id`
*Membutuhkan role admin*

**Response (204 No Content):**
> Tidak ada body response.

---

## Categories Module (`/api/categories`)

### List All Categories

`GET /api/categories`
*Public*

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": [
    {
      "id": "01HSX1ABCDEF23456789JKLMN",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Gadgets and devices",
      "created_at": "2026-03-20T10:00:00.000Z",
      "updated_at": "2026-03-20T10:00:00.000Z"
    },
    {
      "id": "01HSX1ABCDEF23456789JKLMO",
      "name": "Clothing",
      "slug": "clothing",
      "description": "Apparel and accessories",
      "created_at": "2026-03-20T10:00:00.000Z",
      "updated_at": "2026-03-20T10:00:00.000Z"
    }
  ]
}
```

### Admin: Get Category by ID

`GET /api/categories/:id`
*Membutuhkan role admin*

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
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

### Admin: Create Category

`POST /api/categories`
*Membutuhkan role admin*

**Request Body:**
```json
{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Gadgets and devices"
}
```

**Response (201 Created):**
```json
{
  "metadata": {
    "code": 201,
    "message": "Success"
  },
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

### Admin: Update Category

`PUT /api/categories/:id`
*Membutuhkan role admin*

**Request Body:**
```json
{
  "name": "Electronics & Gadgets",
  "description": "Updated description"
}
```

> Semua field bersifat opsional.

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HSX1ABCDEF23456789JKLMN",
    "name": "Electronics & Gadgets",
    "slug": "electronics",
    "description": "Updated description",
    "created_at": "2026-03-20T10:00:00.000Z",
    "updated_at": "2026-03-20T10:05:00.000Z"
  }
}
```

### Admin: Delete Category

`DELETE /api/categories/:id`
*Membutuhkan role admin*

**Response (204 No Content):**
> Tidak ada body response.

---

## Products Module (`/api/products`)

### List All Products (Paginated)

`GET /api/products?page=1&limit=10&search=phone&category_id=01HSX1ABCDEF23456789JKLMN`
*Public*

> Query params:
> - `page` (opsional, default: 1)
> - `limit` (opsional, default: 10)
> - `search` (opsional, FULLTEXT search pada name dan description)
> - `category_id` (opsional, filter berdasarkan kategori)

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "data": [
      {
        "id": "01HSY1ABCDEF23456789JKLMN",
        "category_id": "01HSX1ABCDEF23456789JKLMN",
        "name": "Smartphone X",
        "slug": "smartphone-x",
        "description": "Latest smartphone with advanced features",
        "price": "999.00",
        "stock": 50,
        "image_url": "https://ik.imagekit.io/abc123/products/smartphone.jpg",
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

### Get Best Sellers

`GET /api/products/best-sellers?limit=5`
*Public*

> `limit` (opsional, default: 5)

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": [
    {
      "id": "01HSY1ABCDEF23456789JKLMN",
      "category_id": "01HSX1ABCDEF23456789JKLMN",
      "name": "Smartphone X",
      "slug": "smartphone-x",
      "description": "Latest smartphone with advanced features",
      "price": "999.00",
      "stock": 50,
      "image_url": "https://ik.imagekit.io/abc123/products/smartphone.jpg",
      "created_at": "2026-03-20T10:00:00.000Z",
      "updated_at": "2026-03-20T10:00:00.000Z",
      "total_sold": 150
    }
  ]
}
```

### Get Product by Slug

`GET /api/products/slug/smartphone-x`
*Public*

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HSY1ABCDEF23456789JKLMN",
    "category_id": "01HSX1ABCDEF23456789JKLMN",
    "name": "Smartphone X",
    "slug": "smartphone-x",
    "description": "Latest smartphone with advanced features",
    "price": "999.00",
    "stock": 50,
    "image_url": "https://ik.imagekit.io/abc123/products/smartphone.jpg",
    "created_at": "2026-03-20T10:00:00.000Z",
    "updated_at": "2026-03-20T10:00:00.000Z"
  }
}
```

### List Products by Category

`GET /api/products/category/electronics?page=1&limit=10`
*Public*

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "data": [
      {
        "id": "01HSY1ABCDEF23456789JKLMN",
        "category_id": "01HSX1ABCDEF23456789JKLMN",
        "name": "Smartphone X",
        "slug": "smartphone-x",
        "description": "Latest smartphone with advanced features",
        "price": "999.00",
        "stock": 50,
        "image_url": "https://ik.imagekit.io/abc123/products/smartphone.jpg",
        "created_at": "2026-03-20T10:00:00.000Z",
        "updated_at": "2026-03-20T10:00:00.000Z"
      }
    ],
    "meta": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "total_pages": 3
    }
  }
}
```

### Admin: Get Product by ID

`GET /api/products/:id`
*Membutuhkan role admin*

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HSY1ABCDEF23456789JKLMN",
    "category_id": "01HSX1ABCDEF23456789JKLMN",
    "name": "Smartphone X",
    "slug": "smartphone-x",
    "description": "Latest smartphone with advanced features",
    "price": "999.00",
    "stock": 50,
    "image_url": "https://ik.imagekit.io/abc123/products/smartphone.jpg",
    "created_at": "2026-03-20T10:00:00.000Z",
    "updated_at": "2026-03-20T10:00:00.000Z"
  }
}
```

### Admin: Create Product

`POST /api/products`
*Membutuhkan role admin. Content-Type: multipart/form-data.*

**Request Body (multipart/form-data):**

| Field | Type | Required | Deskripsi |
|-------|------|----------|-----------|
| `name` | string | Ya | Nama produk |
| `slug` | string | Ya | URL slug (unique) |
| `description` | string | Ya | Deskripsi produk |
| `price` | string | Ya | Harga (contoh: "999.00") |
| `stock` | string | Ya | Stok (contoh: "50") |
| `category_id` | string | Ya | ULID kategori |
| `image` | file | Tidak | File gambar (maks 5MB) |

**Response (201 Created):**
```json
{
  "metadata": {
    "code": 201,
    "message": "Success"
  },
  "data": {
    "id": "01HSY1ABCDEF23456789JKLMN",
    "category_id": "01HSX1ABCDEF23456789JKLMN",
    "name": "Smartphone X",
    "slug": "smartphone-x",
    "description": "Latest smartphone with advanced features",
    "price": "999.00",
    "stock": 50,
    "image_url": "https://ik.imagekit.io/abc123/products/01HSY1ABCDEF23456789JKLMN_smartphone.jpg",
    "created_at": "2026-03-20T10:00:00.000Z",
    "updated_at": "2026-03-20T10:00:00.000Z"
  }
}
```

### Admin: Update Product

`PUT /api/products/:id`
*Membutuhkan role admin. Content-Type: multipart/form-data.*

**Request Body (multipart/form-data):**
> Sama dengan Create Product. Semua field bersifat opsional.

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HSY1ABCDEF23456789JKLMN",
    "category_id": "01HSX1ABCDEF23456789JKLMN",
    "name": "Smartphone X Pro",
    "slug": "smartphone-x-pro",
    "description": "Updated description",
    "price": "1099.00",
    "stock": 45,
    "image_url": "https://ik.imagekit.io/abc123/products/new-image.jpg",
    "created_at": "2026-03-20T10:00:00.000Z",
    "updated_at": "2026-03-20T10:05:00.000Z"
  }
}
```

### Admin: Delete Product

`DELETE /api/products/:id`
*Membutuhkan role admin*

**Response (204 No Content):**
> Tidak ada body response.

---

## Carts Module (`/api/carts`)

> Semua endpoint modul ini membutuhkan autentikasi.

### Get My Cart

`GET /api/carts`

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
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
          "image_url": "https://ik.imagekit.io/abc123/products/smartphone.jpg"
        }
      }
    ]
  }
}
```

> Jika keranjang kosong, `items` akan berisi array kosong `[]`.

### Add Item to Cart

`POST /api/carts/items`

**Request Body:**
```json
{
  "product_id": "01HSY1ABCDEF23456789JKLMN",
  "quantity": 1
}
```

> Jika produk sudah ada di keranjang, quantity akan ditambahkan.

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HSZ1ABCDEF23456789JKLMN",
    "user_id": "01HS1234567890ABCDEFGHJKLMN",
    "items": [
      {
        "id": "01HSZ2ABCDEF23456789JKLMN",
        "cart_id": "01HSZ1ABCDEF23456789JKLMN",
        "product_id": "01HSY1ABCDEF23456789JKLMN",
        "quantity": 3,
        "product": {
          "name": "Smartphone X",
          "price": "999.00",
          "image_url": "https://ik.imagekit.io/abc123/products/smartphone.jpg"
        }
      }
    ]
  }
}
```

### Update Cart Item Quantity

`PUT /api/carts/items/:itemId`

**Request Body:**
```json
{
  "quantity": 5
}
```

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HSZ1ABCDEF23456789JKLMN",
    "user_id": "01HS1234567890ABCDEFGHJKLMN",
    "items": [
      {
        "id": "01HSZ2ABCDEF23456789JKLMN",
        "cart_id": "01HSZ1ABCDEF23456789JKLMN",
        "product_id": "01HSY1ABCDEF23456789JKLMN",
        "quantity": 5,
        "product": {
          "name": "Smartphone X",
          "price": "999.00",
          "image_url": "https://ik.imagekit.io/abc123/products/smartphone.jpg"
        }
      }
    ]
  }
}
```

### Remove Cart Item

`DELETE /api/carts/items/:itemId`

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HSZ1ABCDEF23456789JKLMN",
    "user_id": "01HS1234567890ABCDEFGHJKLMN",
    "items": []
  }
}
```

---

## Orders Module (`/api/orders`)

> Semua endpoint modul ini membutuhkan autentikasi.

### Create Order (Checkout)

`POST /api/orders`

> Mengkonversi semua item di keranjang menjadi pesanan. Stok produk akan dikurangi. Keranjang akan dikosongkan.

**Response (201 Created):**
```json
{
  "metadata": {
    "code": 201,
    "message": "Success"
  },
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

**Response (400 Bad Request) — Keranjang kosong:**
```json
{
  "metadata": {
    "code": 400,
    "message": "Cart is empty"
  }
}
```

### Get My Orders

`GET /api/orders/me`

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
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

### Get Order by ID

`GET /api/orders/:id`

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
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

> User hanya bisa melihat pesanan sendiri. Admin bisa melihat semua pesanan.

### Admin: List All Orders

`GET /api/orders`
*Membutuhkan role admin*

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
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

### Admin: Update Order Status

`PATCH /api/orders/:id/status`
*Membutuhkan role admin*

**Request Body:**
```json
{
  "status": "shipped"
}
```

> Nilai status: `pending`, `shipped`, `delivered`, `cancelled`

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HT1ABCDEF23456789JKLMN",
    "user_id": "01HS1234567890ABCDEFGHJKLMN",
    "total_amount": "1998.00",
    "status": "shipped",
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

### Admin: Get Order Report

`GET /api/orders/report?start_date=2026-03-01&end_date=2026-03-31`
*Membutuhkan role admin*

> Query params:
> - `start_date` (opsional, format: YYYY-MM-DD)
> - `end_date` (opsional, format: YYYY-MM-DD)
> - Default: bulan berjalan

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
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

## Referensi Status Code

| Code | Keterangan |
|------|------------|
| 200 | Sukses |
| 201 | Created (berhasil membuat resource baru) |
| 204 | No Content (berhasil menghapus, tanpa body) |
| 400 | Bad Request (validasi gagal / bisnis error) |
| 401 | Unauthorized (token tidak valid atau tidak ada) |
| 403 | Forbidden (akses ditolak, bukan admin) |
| 404 | Not Found (resource tidak ditemukan) |
| 409 | Conflict (data sudah ada, contoh: email duplikat) |
| 429 | Rate Limit (melebihi 20 request/detik) |
| 500 | Internal Server Error |
