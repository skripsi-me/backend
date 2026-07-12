# AGENTS.md — Backend E-Commerce API

## Stack

Fastify 5 + Drizzle ORM + MySQL (MariaDB via Docker) + TypeBox validation.
ESM only (`"type": "module"`). TypeScript strict mode with `verbatimModuleSyntax`.

## Commands

```bash
cp .env.example .env          # required before anything runs
docker compose up -d           # MariaDB on 127.0.0.1:3306
npx drizzle-kit push           # sync schema to DB (dev only)
npm run dev                    # tsx watch src/server.ts
npm run build                  # tsc → dist/
npm run start                  # node dist/server.js
npm run lint:fix               # eslint --fix + prettier --write
npm test                       # vitest (requires running MariaDB)
```

**Order matters:** `drizzle-kit push` before first run. Tests hit a real DB, not a mock.

## Module Pattern

Each module in `src/modules/<name>/` follows the same layout:
- `*.schema.ts` — TypeBox schemas (request/response validation)
- `*.service.ts` — DB queries via Drizzle
- `*.controller.ts` — request handlers
- `*.routes.ts` — Fastify route registration
- `tests/*.test.ts` — vitest integration tests

Routes register at prefixes defined in `src/app.ts` (e.g., `/api/auth`, `/api/products`).

## Key Conventions

- **IDs:** ULID via `ulidx` (26 chars), generated in service layer.
- **Auth:** JWT in HttpOnly signed cookies. `fastify.authenticate` / `fastify.adminOnly` hooks.
- **Response format:** `formatSuccess()` / `formatError()` from `src/shared/utils/response.util.ts`. All responses wrapped in `{ metadata: { code, message }, data, error? }`.
- **Imports:** Use `.js` extensions in all imports (required by `nodenext` module resolution).
- **Type imports:** ESLint enforces `import type { ... }` with inline-style.
- **DB column casing:** Drizzle maps camelCase TS fields to snake_case DB columns automatically.

## Testing

- Tests use `app.inject()` (Fastify's light inject), not HTTP.
- `tests/setup.ts` mocks ImageKit and sets test env vars.
- Each test suite cleans up after itself (deletes test rows in `afterAll`).
- Tests require a running MariaDB instance — they are not mocked.

## Database

- Single schema file: `src/db/schema.ts` (all tables + relations).
- Migrations output to `drizzle/` directory.
- `scripts/setup-fulltext.js` — adds FULLTEXT indexes on `products.name` and `products.description` (run manually).
- `drop-tables.ts` — destructive utility for dev reset only.

## Gotchas

- `pnpm` is the package manager (`pnpm-lock.yaml` present), but scripts use `npm run`.
- `bcrypt` and `esbuild` require native builds — pnpm `onlyBuiltDependencies` allows them.
- `docker-compose.yml` binds MariaDB to `127.0.0.1` only (not exposed externally).
- Products search uses MySQL `MATCH AGAINST` (FULLTEXT) — requires indexes from `scripts/setup-fulltext.js`.
- `pnpm-lock.yaml` is gitignored — run `pnpm install` after clone.
