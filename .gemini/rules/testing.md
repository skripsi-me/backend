## TESTING & VALIDATION
1. **Framework:** `vitest`.
2. **Integration Tests:** Construct integration tests utilizing Fastify's native `app.inject()` to bypass network overhead.
3. **Unit Tests:** Mock external SDKs (ImageKit) and database layers during unit test execution.
4. **Validation:** Verify HTTP status codes strictly match the intended error abstraction layer.