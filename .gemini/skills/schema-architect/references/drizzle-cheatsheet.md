# Drizzle ORM Cheatsheet (MySQL)

## Common Types
- `varchar('name', { length: 255 })`
- `text('name')`
- `decimal('name', { precision: 12, scale: 2 })`
- `int('name')`
- `timestamp('name')`
- `boolean('name')`

## Constraints
- `.primaryKey()`
- `.notNull()`
- `.unique()`
- `.default(value)`
- `.references(() => table.column)`

## Relations
```typescript
export const parentRelations = relations(parent, ({ many }) => ({
  children: many(child),
}));

export const childRelations = relations(child, ({ one }) => ({
  parent: one(parent, {
    fields: [child.parentId],
    references: [parent.id],
  }),
}));
```
