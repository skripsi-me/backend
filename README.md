# Backend E-Commerce API (Fastify + Drizzle)

A high-performance, secure backend for an e-commerce platform built with Node.js, Fastify, and Drizzle ORM.

## 🚀 Technical Specifications

- **Framework:** Fastify (Node.js 20+)
- **Database:** MySQL (InnoDB) with Drizzle ORM
- **Authentication:** JWT + HttpOnly Cookies (Signed)
- **Validation:** TypeBox (AJV)
- **Primary Keys:** ULID (26 characters)
- **Media Storage:** ImageKit.io SDK
- **Rate Limit:** 20 RPS per IP

## 📦 Standard Response Format

All API responses follow a consistent structure:

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

## 🔐 Auth Module
Handles registration, session management, and security.

### Register
`POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Full Name",
  "address": "Street Address (Optional)",
  "phoneNumber": "0812345678 (Optional)"
}
```

### Login
`POST /api/auth/login`
Sets `token` and `refreshToken` in HttpOnly cookies.

### Refresh Token
`POST /api/auth/refresh`
Uses `refreshToken` cookie to issue a new access `token`.

### Change Password
`POST /api/auth/change-password`
*Requires Authentication*

---

## 👤 User Module
Handles user profiles and administrative management.

### Get My Profile
`GET /api/users/me`
*Requires Authentication*

### Update My Profile
`PATCH /api/users/me`
*Requires Authentication*

### Admin: List All Users
`GET /api/users`
*Requires Admin Role*

---

## 📁 Categories
Product categorization and organization.

### List Categories
`GET /api/categories`
*Public*

### Admin: Create Category
`POST /api/categories`
*Requires Admin Role*
Fields: `name`, `slug`, `description`.

---

## 🏷️ Products
Handles product catalog and inventory.

### List All Products
`GET /api/products`
*Public*

### Get Product by Slug
`GET /api/products/slug/:slug`
*Public*

### List Products by Category
`GET /api/products/category/:categorySlug`
*Public*

### Admin: Create Product
`POST /api/products`
*Requires Admin Role. Content-Type: multipart/form-data.*

---

## 🛒 Shopping Cart
*Requires Authentication*

### Get Cart
`GET /api/carts`

---

## 📦 Orders
*Requires Authentication*

### Checkout (Create Order)
`POST /api/orders`
*Converts cart items into an order.*

---

## 🛠️ Development

1. **Setup Env:** `cp .env.example .env`
2. **Install:** `npm install`
3. **Database Migration:** `npx drizzle-kit push`
4. **Dev Server:** `npm run dev`
5. **Tests:** `npm test`
