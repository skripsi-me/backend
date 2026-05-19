# API Request & Response Samples

This guide provides sample requests and responses for all available endpoints. All API responses follow a standardized format.

## 🛰️ Standard Response Format

```json
{
  "metadata": {
    "code": number,
    "message": string
  },
  "data": object | array | null,
  "error": {
    "field_name": "validation error message"
  } // Only present on errors
}
```

---

## 🔐 Authentication Module

### Register User
`POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "address": "123 Street Name",
  "phoneNumber": "08123456789"
}
```

**Response (201 Created):**
```json
{
  "metadata": {
    "code": 201,
    "message": "User registered successfully"
  },
  "data": {
    "id": "01HS1234567890ABCDEFGHJKLM",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
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
    "id": "01HS1234567890ABCDEFGHJKLM",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```
*Sets `token` and `refreshToken` in HttpOnly cookies.*

### Refresh Session
`POST /api/auth/refresh`

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Token refreshed successfully"
  },
  "data": null
}
```

### Logout
`POST /api/auth/logout`

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Logged out successfully"
  },
  "data": null
}
```

---

## 👤 User Module

### Get My Profile
`GET /api/users/me`

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": {
    "id": "01HS1234567890ABCDEFGHJKLM",
    "email": "user@example.com",
    "name": "John Doe",
    "address": "123 Street Name",
    "phoneNumber": "08123456789",
    "role": "user",
    "createdAt": "2024-03-20T10:00:00.000Z"
  }
}
```

### Update My Profile
`PATCH /api/users/me`

**Request Body:**
```json
{
  "name": "John Updated",
  "address": "456 New Street"
}
```

---

## 📁 Categories Module

### List All Categories
`GET /api/categories`

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": [
    {
      "id": "01HSX1",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Gadgets and devices"
    }
  ]
}
```

---

## 🏷️ Products Module

### List All Products (Paginated)
`GET /api/products?page=1&limit=10&search=phone`

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
        "id": "01HSY1",
        "name": "Smartphone X",
        "slug": "smartphone-x",
        "price": "999.00",
        "stock": 50,
        "image_url": "https://ik.imagekit.io/..."
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

### Get Product by Slug
`GET /api/products/slug/smartphone-x`

### Get Best Sellers
`GET /api/products/best-sellers?limit=5`

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": [
    {
      "id": "01HSY1",
      "name": "Smartphone X",
      "total_sold": 150,
      "price": "999.00",
      "stock": 50
    }
  ]
}
```

---

## 🛒 Shopping Cart Module

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
    "id": "01HSZ1",
    "items": [
      {
        "id": "01HSZ2",
        "product_id": "01HSY1",
        "quantity": 2,
        "product": {
          "name": "Smartphone X",
          "price": "999.00"
        }
      }
    ]
  }
}
```

### Add Item to Cart
`POST /api/carts/items`

**Request Body:**
```json
{
  "productId": "01HSY1",
  "quantity": 1
}
```

---

## 📦 Orders Module

### Create Order (Checkout)
`POST /api/orders`

**Response (201 Created):**
```json
{
  "metadata": {
    "code": 201,
    "message": "Order created successfully"
  },
  "data": {
    "id": "01HT1",
    "total_amount": "1998.00",
    "status": "pending",
    "items": [...]
  }
}
```

### Get Order Report (Admin)
`GET /api/orders/report?start_date=2024-03-01&end_date=2024-03-31`

**Response (200 OK):**
```json
{
  "metadata": {
    "code": 200,
    "message": "Success"
  },
  "data": [
    {
      "date": "2024-03-20",
      "total_amount": 5000.00,
      "order_count": 10
    }
  ]
}
```
