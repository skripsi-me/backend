# Naming Conventions Reference

## General Rules
- Be descriptive but concise.
- Avoid abbreviations unless they are industry standard (e.g., `id`, `url`).
- Use English for all names.

## TypeScript
| Entity | Case | Example |
| :--- | :--- | :--- |
| Classes | `PascalCase` | `UsersService` |
| Interfaces / Types | `PascalCase` | `UserSchema` |
| Variables / Constants | `camelCase` | `userCount` |
| Methods / Functions | `camelCase` | `findById` |
| Enums | `PascalCase` | `UserRole` |
| Enum Members | `PascalCase` | `UserRole.Admin` |

## Database
| Entity | Case | Example |
| :--- | :--- | :--- |
| Tables | `snake_case` (plural) | `cart_items` |
| Columns | `snake_case` | `created_at` |
| Indexes | `snake_case` | `user_email_idx` |

## Files & Folders
- Folders: `kebab-case` (e.g., `order-management`).
- Files: `kebab-case.suffix.ts` (e.g., `orders.controller.ts`).
- Tests: `name.test.ts`.
