# File: .gemini/tasks/phase_3_auth.md

## PHASE 3: AUTHENTICATION & USER MODULE
1. **Objective:** Implement secure user registration and login workflows.
2. **Execution Steps:**
   * Create `src/shared/utils/hash.util.ts` for `bcrypt` password hashing (minimum 10 rounds).
   * Create `src/plugins/auth.plugin.ts` utilizing `@fastify/jwt` and `@fastify/cookie`.
   * Implement the `users` module (`controller`, `service`, `schema`, `route`).
   * Enforce JWT storage strictly within `HttpOnly` secure cookies. Do not return tokens in the JSON response body.