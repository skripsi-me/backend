# Industry-Standard Design Patterns

## 1. Repository Pattern (via Drizzle)
Decouple the data source from the business logic.
- **Service Layer**: Handles business logic, transactions, and calls the ORM.
- **Schema Layer**: Defines the data structure and relations.

## 2. Dependency Injection
Inject dependencies via constructor to facilitate testing and decoupling.
```typescript
export class Controller {
  constructor(private service: Service) {}
}
```

## 3. Singleton (via Fastify Decorators)
Use Fastify's `.decorate()` to share global utilities (DB connection, Auth helpers) instead of importing them everywhere.

## 4. Factory Pattern
Use for complex object creation, especially when creating multiple related entities (e.g., an Order with multiple OrderItems).

## 5. Middleware / Hooks
Use Fastify hooks (`onRequest`, `preHandler`) for cross-cutting concerns:
- Authentication
- Authorization
- Request Logging
- Input Sanitization
