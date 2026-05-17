## TECHNICAL SPECIFICATIONS & CONSTRAINTS
1. **Framework:** Fastify (Node.js 20+).
   * Hard limit of 20 RPS per IP via `@fastify/rate-limit`.
   * Global `TypeBoxTypeProvider` required on the Fastify instance for `@sinclair/typebox`.
   * All global plugins MUST be wrapped with `fastify-plugin`.
2. **Database:** MySQL (InnoDB).
   * `innodb_buffer_pool_size` capped at 512MB - 1GB to prevent server OOM.
   * Primary keys MUST use ULID (`varchar(26)`).
3. **ORM:** Drizzle ORM. 
   * Native FULLTEXT indexes required on `products.name` and `products.description`.
4. **Authentication:** JWT & Fastify Cookie. 
   * Tokens strictly stored in HttpOnly secure cookies to mitigate XSS.
5. **Storage:** ImageKit.io SDK. 
   * Direct SDK usage; zero local disk storage for media files.