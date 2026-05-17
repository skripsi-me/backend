import { mysqlTable, varchar, text, decimal, int, timestamp, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 26 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  address: text('address'),
  phoneNumber: varchar('phone_number', { length: 20 }),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  refreshToken: varchar('refresh_token', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const categories = mysqlTable('categories', {
  id: varchar('id', { length: 26 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const products = mysqlTable('products', {
  id: varchar('id', { length: 26 }).primaryKey(),
  categoryId: varchar('category_id', { length: 26 }).references(() => categories.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  stock: int('stock').notNull().default(0),
  imageUrl: varchar('image_url', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  nameIndex: index('name_idx').on(table.name),
  slugIndex: index('slug_idx').on(table.slug),
  descIndex: index('description_idx').on(table.description),
}));

export const carts = mysqlTable('carts', {
  id: varchar('id', { length: 26 }).primaryKey(),
  userId: varchar('user_id', { length: 26 }).references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const cartItems = mysqlTable('cart_items', {
  id: varchar('id', { length: 26 }).primaryKey(),
  cartId: varchar('cart_id', { length: 26 }).references(() => carts.id).notNull(),
  productId: varchar('product_id', { length: 26 }).references(() => products.id).notNull(),
  quantity: int('quantity').notNull().default(1),
});

export const orders = mysqlTable('orders', {
  id: varchar('id', { length: 26 }).primaryKey(),
  userId: varchar('user_id', { length: 26 }).references(() => users.id).notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const orderItems = mysqlTable('order_items', {
  id: varchar('id', { length: 26 }).primaryKey(),
  orderId: varchar('order_id', { length: 26 }).references(() => orders.id).notNull(),
  productId: varchar('product_id', { length: 26 }).references(() => products.id).notNull(),
  quantity: int('quantity').notNull(),
  priceAtPurchase: decimal('price_at_purchase', { precision: 12, scale: 2 }).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  cart: one(carts, {
    fields: [users.id],
    references: [carts.userId],
  }),
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
