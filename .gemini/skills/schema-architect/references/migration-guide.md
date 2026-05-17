# Migration Guide

## 1. Local Development
Always use `npx drizzle-kit push` to sync your local database with the schema changes quickly.

## 2. Production
For production, use the migration generation workflow:
1. `npx drizzle-kit generate`
2. Review the generated SQL in the `drizzle/` folder.
3. Apply using `npx drizzle-kit migrate`.

## 3. Safe Refactoring
- **Renaming Columns**: Drizzle Kit will ask for confirmation. Ensure you choose the correct "Rename" option instead of "Drop and Create" to preserve data.
- **Changing Nullability**: Ensure existing data complies with the new constraint before applying.
- **Adding Indexes**: Large tables may lock during index creation. Plan accordingly.
