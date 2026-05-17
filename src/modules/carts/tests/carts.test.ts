import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import { db } from '../../../config/database.js';
import { carts, cartItems, products, users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { hashPassword } from '../../../shared/utils/hash.util.js';

describe('Carts Module', () => {
  let app: any;
  let userCookie: string;
  let productId: string;
  const userEmail = 'cart_user_unique@example.com';

  beforeAll(async () => {
    app = await buildApp();
    
    // Create user
    const userId = ulid();
    const hashedPassword = await hashPassword('password');
    await db.insert(users).values({
      id: userId,
      email: userEmail,
      password: hashedPassword,
      name: 'Cart User Unique',
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: userEmail,
        password: 'password',
      },
    });

    userCookie = loginResponse.cookies.find((c: any) => c.name === 'token')!.value;

    // Create product
    productId = ulid();
    await db.insert(products).values({
      id: productId,
      name: 'Cart Test Product Unique',
      slug: 'cart-test-prod-unique',
      price: '100.00',
      stock: 10,
    });
  });

  afterAll(async () => {
    await db.delete(cartItems);
    await db.delete(carts);
    await db.delete(users).where(eq(users.email, userEmail));
    await db.delete(products).where(eq(products.id, productId));
  });

  it('should get an empty cart initially', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/carts',
      cookies: { token: userCookie },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.metadata.code).toBe(200);
    expect(body.data.items.length).toBe(0);
  });

  it('should add an item to the cart', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/carts/items',
      cookies: { token: userCookie },
      payload: {
        productId,
        quantity: 2,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.metadata.code).toBe(200);
    expect(body.data.items.length).toBe(1);
    expect(body.data.items[0].productId).toBe(productId);
    expect(body.data.items[0].quantity).toBe(2);
  });
});
