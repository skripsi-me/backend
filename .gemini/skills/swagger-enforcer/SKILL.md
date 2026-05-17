---
name: swagger-enforcer
description: Ensure every Fastify route contains strict TypeBox schemas enriched with OpenAPI metadata for Swagger documentation. Trigger during route/controller creation or refactoring.
---

# Fastify OpenAPI (Swagger) Enforcer

This skill ensures all routes are self-documenting and strictly typed for high-quality API exploration.

## 1. EXECUTION PROTOCOL
1. **Schema Validation:** Analyze the target route file. If the route lacks a `schema` object attached to the Fastify handler, execution must halt or the schema must be generated.
2. **Metadata Injection:** Every TypeBox definition must include `.options({ description: '...' })` or similar to populate the Swagger UI.
3. **Route Grouping:** Enforce the `tags` property on every route to group endpoints correctly in the Swagger UI.

## 2. STRICT SWAGGER SCHEMA RULES

| Missing Implementation | Required Fix (Auto-Apply) | Purpose |
| :--- | :--- | :--- |
| **No Route Schema** | Inject `schema: { body: Type.Object(...), response: { 200: Type.Object(...) } }` | Defines the contract for Swagger. |
| **Missing Tags** | Inject `tags: ['Users']` into the route schema object. | Groups endpoints logically. |
| **Missing Summary** | Inject `summary: 'Create new user'` into the schema. | Endpoint title in Swagger UI. |
| **Missing Field Description** | Add `Type.String({ description: '...' })` | Details individual fields. |
| **Missing Security Protocol** | Inject `security: [{ bearerAuth: [] }]` for protected routes. | Adds the lock icon in Swagger UI. |

## 3. CODE GENERATION TEMPLATE

```typescript
import { Type } from '@sinclair/typebox';
import { type FastifyPluginAsync } from 'fastify';

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.post('/users', {
    schema: {
      tags: ['Users'],
      summary: 'Register a new user',
      description: 'Creates a new user and returns the ULID.',
      body: Type.Object({
        email: Type.String({ format: 'email', description: 'Unique email address' }),
        password: Type.String({ minLength: 8, description: 'Minimum 8 characters' })
      }),
      response: {
        201: Type.Object({
          id: Type.String({ description: 'Generated ULID' })
        })
      }
    }
  }, async (request, reply) => {
    // Controller logic here
  });
};
```
