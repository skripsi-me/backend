# 012 — Dokumentasi API untuk Frontend

**Status**: done
**Prioritas**: tinggi
**Terkait**: Kebutuhan dokumentasi API lengkap sebagai referensi frontend

---

## Goal

Buat `docs/API.md` — dokumentasi API lengkap dalam Bahasa Indonesia, Markdown format, dengan contoh request/response JSON untuk semua 36 endpoints.

---

## Konteks

- **File baru**: `docs/API.md`
- **Referensi**: Semua schema di `src/modules/*/schema.ts`, response format di `src/shared/utils/response.util.ts`, auth middleware di `src/plugins/auth.plugin.ts`
- **Target pembaca**: Frontend developer yang perlu consume API ini
- **Total**: 36 endpoints (1 health + 5 auth + 7 users + 5 categories + 8 products + 4 carts + 6 orders)

---

## Struktur Dokumentasi

### 1. Header & Overview
- Base URL
- Auth mechanism (JWT HttpOnly signed cookies: `token`, `refresh_token`)
- Standard response format `{ metadata: { code, message }, data, error? }`
- Content-Type untuk multipart (products)

### 2. Error Handling
- Global error response format
- Validation error format (field-level errors)
- HTTP status codes yang dipakai (200, 201, 400, 401, 403, 404, 409, 415, 500)
- Rate limiting info (register: 3/min, login: 5/min, refresh: 10/min)

### 3. Pagination
- Query params: `page`, `limit` (default 20, max 1000)
- Response meta: `{ total, page, limit, total_pages }`

### 4. Modul Auth (5 endpoints)
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/change-password

### 5. Modul Users (7 endpoints)
- GET /api/users/me
- PATCH /api/users/me
- GET /api/users/ (admin, paginated)
- GET /api/users/:id (admin)
- POST /api/users/ (admin)
- PATCH /api/users/:id (admin)
- DELETE /api/users/:id (admin)

### 6. Modul Categories (5 endpoints)
- GET /api/categories/
- GET /api/categories/:slug
- POST /api/categories/ (admin)
- PATCH /api/categories/:id (admin)
- DELETE /api/categories/:id (admin)

### 7. Modul Products (8 endpoints)
- GET /api/products/best-sellers
- GET /api/products/ (paginated, search, filter)
- GET /api/products/:id (admin)
- GET /api/products/slug/:slug
- GET /api/products/category/:categorySlug (paginated)
- POST /api/products/ (admin, multipart/form-data)
- PATCH /api/products/:id (admin, multipart/form-data)
- DELETE /api/products/:id (admin)

### 8. Modul Carts (4 endpoints)
- GET /api/carts/
- POST /api/carts/items
- PUT /api/carts/items/:itemId
- DELETE /api/carts/items/:itemId

### 9. Modul Orders (6 endpoints)
- GET /api/orders/report (admin)
- POST /api/orders/
- GET /api/orders/me (paginated)
- GET /api/orders/:id
- GET /api/orders/ (admin, paginated)
- PATCH /api/orders/:id/status (admin)

---

## Format per Endpoint

Setiap endpoint ditulis dengan format:

```
### [METHOD] /path

**Autentikasi**: None | authenticate | adminOnly
**Rate Limit**: - | 3 req/menit | 5 req/menit | 10 req/menit

#### Request

**Params**: { ... }
**Query**: { ... }
**Body**: { ... }
**Content-Type**: application/json | multipart/form-data

#### Response

**200/201 Success**:
```json
{ ... }
```

**Error**:
- 400: { ... }
- 401: { ... }
- 403: { ... }
- 404: { ... }
```

---

## Definition of Done

- [ ] File `docs/API.md` dibuat
- [ ] Overview section lengkap (base URL, auth, response format)
- [ ] Error handling section lengkap
- [ ] Pagination section lengkap
- [ ] Semua 36 endpoints terdokumentasi
- [ ] Setiap endpoint punya contoh request dan response JSON
- [ ] Semua error codes untuk setiap endpoint terdokumentasi
- [ ] Bahasa Indonesia, mudah dipahami frontend developer

---

## Verifikasi

```bash
# 1. Cek file ada
ls docs/API.md

# 2. Cek semua endpoints ada (grep method + path)
grep -c "### " docs/API.md  # harus >= 36

# 3. Cek format konsisten
grep -c "```json" docs/API.md  # minimal 72 (request + response per endpoint)
```

---

## Risiko / Catatan

- **Breaking**: Tidak. Ini Pure documentation.
- **Maintenance**: Perlu diupdate jika ada endpoint baru atau perubahan schema.
- **Tidak mengubah kode**: Plan ini hanya membuat file dokumentasi baru.
