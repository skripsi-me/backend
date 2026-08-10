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
  let userId: string;
  let orderId1: string;
  let orderId2: string;
  const userEmail = 'order_user_unique@example.com';
  const adminEmail = 'order_admin_unique@example.com';

  beforeAll(async () => {
    app = await buildApp();

    // Create user
    userId = ulid();
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

    // Create orders directly with explicit timestamps and statuses
    orderId1 = ulid();
    orderId2 = ulid();
    await db.insert(orders).values([
      {
        id: orderId1,
        userId,
        totalAmount: '100.00',
        status: 'pending',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: orderId2,
        userId,
        totalAmount: '200.00',
        status: 'shipped',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);
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
    const productResult = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
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
    const orderId = JSON.parse(ordersList.body).data.data[0].id;

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

  it('should filter own orders by status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/orders/me',
      query: { status: 'pending' },
      cookies: { token: userCookie },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    const ids = body.data.data.map((o: any) => o.id);
    expect(ids).toContain(orderId1);
    expect(ids).not.toContain(orderId2);
    expect(body.data.data.every((o: any) => o.status === 'pending')).toBe(true);
  });

  it('should sort own orders by created_at ascending', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/orders/me',
      query: { sort: 'asc' },
      cookies: { token: userCookie },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.data[0].id).toBe(orderId1);
  });

  it('should filter all orders by status (admin)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/orders',
      query: { status: 'shipped' },
      cookies: { token: adminCookie },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    const ids = body.data.data.map((o: any) => o.id);
    expect(ids).toContain(orderId2);
    expect(body.data.data.every((o: any) => o.status === 'shipped')).toBe(true);
  });

  it('should reject invalid status filter', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/orders/me',
      query: { status: 'bogus' },
      cookies: { token: userCookie },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.metadata.message).toBe('Validation Error');
  });
});
