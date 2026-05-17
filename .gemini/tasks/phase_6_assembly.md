# File: .gemini/tasks/phase_6_assembly.md

## PHASE 6: APPLICATION ASSEMBLY & TESTING
1. **Objective:** Assemble the Fastify application and implement integration tests.
2. **Execution Steps:**
   * Create `src/app.ts`. Register plugins sequentially: Infrastructure -> Security -> Utilities -> Routes.
   * Attach `TypeBoxTypeProvider` globally to the Fastify instance.
   * Create `src/server.ts` to bind the network port and handle Graceful Shutdown (`SIGINT`, `SIGTERM`).
   * Create `tests/setup.ts` to mock the database and ImageKit SDK.
   * Write `vitest` integration tests using Fastify's `app.inject()` method.