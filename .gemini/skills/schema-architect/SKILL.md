---
name: schema-architect
description: Expert guidance for generating and refactoring Drizzle ORM schemas for MySQL. Use this when creating new tables, modifying columns, adding indexes (FULLTEXT/B-Tree), or defining complex entity relations.
---

# Schema Architect Skill

This skill provides expert procedural knowledge for designing and evolving the database layer using **Drizzle ORM** with **MySQL**.

## Core Mandates

### 1. Data Integrity & Types
- **Primary Keys**: MUST use ULIDs (`varchar(26)`). Use the standard pattern: `id: varchar('id', { length: 26 }).primaryKey()`.
- **Naming**: Tables and columns MUST use `snake_case`. TypeScript exports (table objects, relations) MUST use `camelCase` (e.g., `export const orderItems = ...`).
- **Timestamps**: Always include `createdAt` and `updatedAt` with appropriate defaults:
  ```typescript
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  ```

### 2. Relations & Foreign Keys
- Use the `relations` API from `drizzle-orm` for all entity associations.
- Define foreign keys explicitly in the table definition using `.references()`.
- **Constraint Naming**: Let Drizzle handle constraint names unless a specific name is required for migration stability.

### 3. Performance & Indexing
- **Fulltext Search**: Required for searchable text fields (e.g., `products.name`, `products.description`). Define in the table extra properties:
  ```typescript
  (table) => ({
    nameIndex: index('name_idx').on(table.name), // standard index
    // Note: Native FULLTEXT is handled via SQL in migrations or specific Drizzle syntax
  })
  ```
- **Capacities**: Be mindful of field lengths (e.g., `varchar(255)` for emails, `text` for long descriptions).

## Workflows

### Creating a New Table
1. Define the table structure in `src/db/schema.ts` using `mysqlTable`.
2. Add the table to the `relations` definitions at the bottom of the file.
3. Verify the schema by running `npx drizzle-kit check`.

### Refactoring an Existing Table
1. Analyze dependencies (Foreign keys, relations).
2. Apply changes (Add column, modify type, rename).
3. Update the corresponding `relations` if necessary.

## Reference Materials
- See [references/drizzle-cheatsheet.md](references/drizzle-cheatsheet.md) for quick syntax reference.
- See [references/migration-guide.md](references/migration-guide.md) for safe schema evolution patterns.
