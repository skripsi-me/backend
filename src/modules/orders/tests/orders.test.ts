import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import { db } from '../../../config/database.js';
import { orders, orderItems, products, users, carts, cartItems } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { hashPassword } from '../../../shared/utils/hash.util.js';

describe('Orders Module', () => {
  let app: any;
  let userCookie: string;
  let adminCookie: string;
  let productId: string;
  const userEmail = 'order_user_unique@example.com';
  const adminEmail = 'order_admin_unique@example.com';

  beforeAll(async () => {
    app = await buildApp();
    
    // Create user
    const userId = ulid();
    const userHashedPassword = await hashPassword('password');
    await db.insert(users).values({
      id: userId,
      email: userEmail,
      password: userHashedPassword,
      name: 'Order User Unique',
    });

    const userLoginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: userEmail, password: 'password' },
    });
    userCookie = userLoginResponse.cookies.find((c: any) => c.name === 'token')!.value;

    // Create admin
    const adminId = ulid();
    const adminHashedPassword = await hashPassword('password');
    await db.insert(users).values({
      id: adminId,
      email: adminEmail,
      password: adminHashedPassword,
      name: 'Order Admin Unique',
      role: 'admin',
    });

    const adminLoginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: adminEmail, password: 'password' },
    });
    adminCookie = adminLoginResponse.cookies.find((c: any) => c.name === 'token')!.value;

    // Create product
    productId = ulid();
    await db.insert(products).values({
      id: productId,
      name: 'Order Test Product Unique',
      slug: 'order-test-prod-unique',
      price: '50.00',
      stock: 10,
    });
  });

  afterAll(async () => {
    // Delete orders first
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(cartItems);
    await db.delete(carts);
    await db.delete(users).where(eq(users.email, userEmail));
    await db.delete(users).where(eq(users.email, adminEmail));
    await db.delete(products).where(eq(products.id, productId));
  });

  it('should checkout and create an order (COD)', async () => {
    // 1. Add item to cart
    await app.inject({
      method: 'POST',
      url: '/api/carts/items',
      cookies: { token: userCookie },
      payload: { product_id: productId, quantity: 1 },
    });

    // 2. Checkout
    const response = await app.inject({
      method: 'POST',
      url: '/api/orders',
      cookies: { token: userCookie },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.metadata.code).toBe(201);
    expect(body.data.status).toBe('pending');
    expect(body.data.total_amount).toBe('50.00');
    expect(body.data.items.length).toBe(1);
    
    // Verify stock decreased
    const productResult = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    const product = productResult[0];
    expect(product?.stock).toBe(9);
  });

  it('should allow admin to update order status', async () => {
    // Get the order created in previous test
    const ordersList = await app.inject({
      method: 'GET',
      url: '/api/orders/me',
      cookies: { token: userCookie },
    });
    const orderId = JSON.parse(ordersList.body).data[0].id;

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/orders/${orderId}/status`,
      cookies: { token: adminCookie },
      payload: { status: 'shipped' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.metadata.code).toBe(200);
    expect(body.data.status).toBe('shipped');
  });
});
