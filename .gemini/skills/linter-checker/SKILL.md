---
name: linter-checker
description: Analyze target files, identify deviations from enterprise TypeScript/Fastify standards, and automatically apply structural fixes. This skill is designed to enforce strict linting rules, ensuring that all code adheres to best practices for type safety and maintainability. This skill will be automatically triggered when the user requests code review, linting, or refactoring, and will focus on correcting import statements, enforcing Fastify best practices, and ensuring consistent error handling patterns.
---

## 1. SKILL IDENTIFICATION
* **Name:** linter-checker
* **Description:** Analyze target files, identify deviations from enterprise TypeScript/Fastify standards, and automatically apply structural fixes. This skill is designed to enforce strict linting rules, ensuring that all code adheres to best practices for type safety and maintainability.
* **Trigger:** review, linting, refactoring

## 2. EXECUTION PROTOCOL
1. **Static Analysis First:** Do not rely solely on LLM vision. Execute workspace linting commands (e.g., `npm run lint`) to capture deterministic errors.
2. **Abstract Syntax Tree (AST) Awareness:** When modifying imports, ensure type definitions are strictly isolated from runtime imports.
3. **Deterministic Output:** Output only the corrected code blocks. Do not explain the fix unless explicitly requested by the user.

## 3. STRICT LINTING RULES & BEST PRACTICES

| Category | Incorrect Pattern | Required Fix (Auto-Apply) |
| :--- | :--- | :--- |
| **Type Imports** | `import { UserType } from './types'` | `import { type UserType } from './types'` |
| **Mixed Imports** | `import { User, UserType } from './mdl'`| `import { User, type UserType } from './mdl'` |
| **Fastify Scope** | Declaring global variables outside routes. | Move state into database or Fastify decorators. |
| **Error Handling** | `throw new Error("Not found")` | `throw new NotFoundError("Not found")` (Use custom error abstractions). |
| **Export Strategy** | `export default class Controller` | `export class Controller` (Strictly use named exports to prevent refactoring bugs). |