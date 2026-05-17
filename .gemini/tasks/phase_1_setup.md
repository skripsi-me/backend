# File: .gemini/tasks/phase_1_setup.md

## PHASE 1: INFRASTRUCTURE & CONFIGURATION
1. **Objective:** Initialize the Node.js project and set up the core Fastify architecture.
2. **Execution Steps:**
   * Initialize `package.json` and install dependencies: `fastify`, `fastify-plugin`, `@fastify/cors`, `@fastify/helmet`, `@fastify/cookie`, `@fastify/jwt`, `@fastify/rate-limit`, `@sinclair/typebox`, `drizzle-orm`, `mysql2`, `ulidx`, `bcrypt`, `imagekit`, `dotenv`.
   * Install dev dependencies: `typescript`, `tsx`, `drizzle-kit`, `vitest`, `pino-pretty`.
   * Create `src/config/env.ts` to strictly validate required environment variables.
   * Create `src/config/database.ts` configuring `mysql2` pool limits suitable for 2GB RAM.
   * Create `src/plugins/security.plugin.ts` wrapping `@fastify/helmet` and `@fastify/cors` with `fastify-plugin`.
   * Create `src/plugins/rate-limit.plugin.ts` enforcing strictly 20 RPS per IP.

### Expected Output
```text
src/
├── config/
│   ├── database.ts
│   └── env.ts
├── plugins/
│   ├── rate-limit.plugin.ts
│   └── security.plugin.ts
```