# File: .gemini/tasks/phase_2_database.md

## PHASE 2: DATABASE SCHEMA & ORM CONFIGURATION
1. **Objective:** Define the MySQL (InnoDB) database schema using Drizzle ORM.
2. **Execution Steps:**
   * Create `src/db/schema.ts`.
   * Define all primary keys strictly as `varchar(26)` to accommodate ULID generation.
   * Define tables for `users`, `categories`, `products`, `carts`, `cart_items`, `orders`, and `order_items`.
   * Apply MySQL `FULLTEXT` indexes explicitly on `products.name` and `products.description`.
   * Create `drizzle.config.ts` for database migrations.

### Schema Constraints Table
| Table | Column | Type | Index Requirement |
| :--- | :--- | :--- | :--- |
| Any | `id` | `varchar(26)` | Primary Key |
| `products` | `name` | `varchar(255)` | `FULLTEXT` |
| `products` | `description` | `text` | `FULLTEXT` |