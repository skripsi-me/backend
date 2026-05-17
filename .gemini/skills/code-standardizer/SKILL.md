---
name: code-standardizer
description: Standardize code creation and refactoring based on industry standards. Use this when creating new modules, refactoring existing code, or ensuring adherence to clean code, SOLID principles, and project-specific architecture.
---

# Code Standardizer Skill

This skill ensures all code adheres to enterprise-grade Node.js/Fastify standards and project-specific mandates in `GEMINI.md`.

## Core Mandates

### 1. Architectural Integrity
- **Controller-Service Pattern**: Always separate HTTP logic (Controllers) from business logic (Services).
- **Schema-First Development**: Define TypeBox schemas for all requests and responses before implementing logic.
- **Dependency Injection**: Services should be injected into controllers via the constructor.

### 2. Standardized Responses
- Use the global `reply.success(data, message)` for all successful responses.
- Use `formatError(code, message, validationErrors)` for all error responses.
- Ensure all route responses are wrapped in `createStandardResponseSchema`.

### 3. Naming Conventions
- **Files**: `kebab-case.ts` (e.g., `user.controller.ts`).
- **Classes**: `PascalCase`.
- **Variables/Methods**: `camelCase`.
- **Database**: `snake_case` for tables and columns.

### 4. Robust Error Handling
- Never use generic `Error` objects for business logic failures. Use custom error abstractions or specific status codes.
- Map validation errors to the standard `{ field: message }` format.

## Workflows

### Creating a New Module
1. Define the database schema in `src/db/schema.ts`.
2. Create `*.schema.ts` with TypeBox schemas for all CRUD operations.
3. Implement `*.service.ts` for database interactions.
4. Implement `*.controller.ts` for request handling and response formatting.
5. Define routes in `*.routes.ts` using `TypeBoxTypeProvider`.
6. Add integration tests in `tests/*.test.ts`.

### Refactoring Existing Code
1. Identify violations of SOLID principles or DRY.
2. Ensure `import type` is used for all type-only imports.
3. Replace `any` types with explicit interfaces or inferred types.
4. Consolidate logic into clean abstractions in the Service layer.

## Reference Materials
- See [references/naming.md](references/naming.md) for detailed naming rules.
- See [references/patterns.md](references/patterns.md) for industry-standard design patterns.
