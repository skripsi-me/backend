import { buildApp } from './src/app.js';
import { db } from './src/config/database.js';
import { users, categories, products } from './src/db/schema.js';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { hashPassword } from './src/shared/utils/hash.util.js';

(async () => {
  const app = await buildApp();
  const adminId = ulid();
  await db.insert(users).values({ id: adminId, email: 'dbg_admin@example.com', password: await hashPassword('password'), name: 'Dbg', role: 'admin' });
  const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'dbg_admin@example.com', password: 'password' } });
  const cookie = login.cookies.find(c => c.name === 'token')!.value;
  const catId = ulid();
  await db.insert(categories).values({ id: catId, name: 'Dbg Cat', slug: 'dbg-cat' });

  const longName = 'Sus Kering Coklat Lumer Enak '.repeat(12).trim();
  const r1 = await app.inject({ method: 'POST', url: '/api/products', cookies: { token: cookie }, payload: { name: longName, price: 10000, stock: 5, category_id: catId } });
  console.log('truncate:', r1.statusCode, r1.body.slice(0, 300));

  const r2 = await app.inject({ method: 'POST', url: '/api/products', cookies: { token: cookie }, payload: { name: 'EmptyPatchDbg', price: 10, stock: 1, category_id: catId } });
  console.log('create:', r2.statusCode, r2.body.slice(0, 200));
  const pid = JSON.parse(r2.body).data.id;
  const r3 = await app.inject({ method: 'PATCH', url: `/api/products/${pid}`, cookies: { token: cookie }, payload: {} });
  console.log('empty patch:', r3.statusCode, r3.body.slice(0, 200));

  await db.delete(products).where(eq(products.categoryId, catId));
  await db.delete(categories).where(eq(categories.id, catId));
  await db.delete(users).where(eq(users.id, adminId));
  await app.close();
})();
