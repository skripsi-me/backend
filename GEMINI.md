# Project: E-Commerce Backend (Fastify + Drizzle)

## 📖 Overview
This is a high-performance, enterprise-grade Node.js backend built with **Fastify** and **Drizzle ORM**. It serves as the core engine for an e-commerce platform, handling user authentication, product catalogs, shopping carts, and order processing.

### Key Technologies
- **Runtime:** Node.js 20+ (ES Modules)
- **Framework:** Fastify v5
- **Database:** MySQL (MariaDB compatible) via Drizzle ORM
- **Authentication:** JWT stored in HttpOnly secure cookies
- **Validation:** TypeBox (JSON Schema)
- **Primary Keys:** ULIDs (Universally Unique Lexicographically Sortable Identifiers)
- **Media Storage:** ImageKit.io SDK
- **Rate Limiting:** @fastify/rate-limit (20 RPS per IP)

---

## 🏗️ Architecture & Conventions

### 1. Module-Based Structure
The project is organized into domain-specific modules under `src/modules/`. Each module contains:
- `*.schema.ts`: TypeBox schemas for request/response validation.
- `*.service.ts`: Business logic and database interactions.
- `*.controller.ts`: HTTP request handling and standardized response formatting.
- `*.routes.ts`: Route definitions using `TypeBoxTypeProvider`.
- `tests/*.test.ts`: Integration tests using Fastify's `app.inject()`.

### 2. Standardized JSON Response
All API endpoints MUST return the following structure:
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
- **Success:** Use the `reply.success(data, message)` decorator.
- **Error:** Use the `formatError(code, message, validationErrors)` utility.

### 3. Database & ORM
- **Schema:** Defined in `src/db/schema.ts` using `snake_case` for columns and tables.
- **Migrations:** Managed via `drizzle-kit`.
- **Optimization:** MySQL `innodb_buffer_pool_size` is capped at 512MB-1GB for resource efficiency.

---

## 🛠️ Building & Running

### Key Commands
- **Install Dependencies:** `npm install`
- **Development Mode:** `npm run dev` (uses `tsx watch`)
- **Run Tests:** `npm test` (uses `vitest`)
- **Lint & Fix:** `npm run lint:fix` (ESLint + Prettier)
- **Database Push:** `npx drizzle-kit push` (Sync schema to database)

### Environment Setup
A `.env` file is required in the root. Refer to `.env.example` for the list of mandatory variables:
- `DATABASE_*`: Connection details for MySQL.
- `JWT_SECRET` & `COOKIE_SECRET`: Keys for secure authentication.
- `IMAGEKIT_*`: Credentials for media storage.

---

## 🛡️ Coding Standards
- **TypeScript:** Strict mode enabled.
- **Imports:** Use `import type` for all type-only imports (`verbatimModuleSyntax` is active).
- **Naming:**
  - Classes: `PascalCase`
  - Methods/Variables: `camelCase`
  - Schemas: `PascalCase` suffix with `Schema` (e.g., `UserSchema`)
  - Request/Response API: `snake_case`
- **Security:** Helmet and CORS are enabled globally via plugins in `src/plugins/`.
