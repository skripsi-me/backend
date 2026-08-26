import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import { db } from '../../../config/database.js';
import { products, categories, users, orders, orderItems } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { hashPassword } from '../../../shared/utils/hash.util.js';
import { type FastifyInstance } from 'fastify';

function buildMultipartBody(
  fields: Record<string, string>,
  file?: { filename: string; contentType: string; content: Buffer },
) {
  const boundary = '----TestBoundary' + ulid();
  const parts: Buffer[] = [];

  for (const [key, value] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`,
      ),
    );
  }

  if (file) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`,
      ),
    );
    parts.push(file.content);
    parts.push(Buffer.from('\r\n'));
  }

  parts.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    payload: Buffer.concat(parts),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}

describe('Products Module', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let categoryId: string;
  const adminEmail = 'admin_prod_unique@example.com';

  beforeAll(async () => {
    app = await buildApp();

    // Create admin user
    const adminId = ulid();
    const hashedPassword = await hashPassword('password');
    await db.insert(users).values({
      id: adminId,
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin Product',
      role: 'admin',
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: adminEmail,
        password: 'password',
      },
    });

    adminCookie = loginResponse.cookies.find((c) => c.name === 'token')!.value;

    // Create a category
    categoryId = ulid();
    await db.insert(categories).values({
      id: categoryId,
      name: 'Test Category Unique for Prod',
      slug: 'test-cat-prod-unique',
    });

    // Create some products
    await db.insert(products).values([
      {
        id: ulid(),
        name: 'Gaming Laptop Unique',
        slug: 'gaming-laptop-unique',
        description: 'High performance gaming laptop with RTX 3080',
        price: '2500.00',
        stock: 10,
        categoryId,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: ulid(),
        name: 'Mechanical Keyboard Unique',
        slug: 'mechanical-keyboard-unique',
        description: 'RGB backlit mechanical keyboard with blue switches',
        price: '150.00',
        stock: 50,
        categoryId,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, adminEmail));
    await db.delete(products).where(eq(products.categoryId, categoryId));
    await db.delete(categories).where(eq(categories.id, categoryId));
  });

  it('should list products with pagination', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
      query: { page: '1', limit: '1' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.metadata.code).toBe(200);
    expect(body.data.data.length).toBe(1);
    expect(body.data.meta.total).toBeGreaterThanOrEqual(2);
  });

  it('should search products using fulltext search', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
      query: { search: 'gaming' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.metadata.code).toBe(200);
    expect(body.data.data.some((p: any) => p.name.toLowerCase().includes('gaming'))).toBe(true);
  });

  it('should sort products by created_at ascending', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
      query: { category_id: categoryId, sort: 'asc' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.data[0].name).toBe('Gaming Laptop Unique');
  });

  it('should sort products by created_at descending (default)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
      query: { category_id: categoryId },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.data[0].name).toBe('Mechanical Keyboard Unique');
  });

  it('should sort products by category slug', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products/category/test-cat-prod-unique',
      query: { sort: 'asc' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.data[0].name).toBe('Gaming Laptop Unique');
  });

  it('should sort products by stock ascending', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
      query: { category_id: categoryId, stock: 'asc' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.data[0].name).toBe('Gaming Laptop Unique');
  });

  it('should sort products by stock descending', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
      query: { category_id: categoryId, stock: 'desc' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.data[0].name).toBe('Mechanical Keyboard Unique');
  });

  it('should reject invalid stock sort value', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
      query: { stock: 'sideways' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should reject invalid sort value', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
      query: { sort: 'sideways' },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.metadata.message).toBe('Data yang dikirim tidak valid. Periksa kembali isian Anda.');
  });

  it('should create a product with image upload', async () => {
    const fakeImage = Buffer.from('fake-image-content');
    const { payload, headers } = buildMultipartBody(
      {
        name: 'Upload Test Product',
        price: '99.99',
        stock: '5',
        category_id: categoryId,
      },
      { filename: 'test.jpg', contentType: 'image/jpeg', content: fakeImage },
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      cookies: { token: adminCookie },
      headers: {
        'content-type': headers['content-type'],
      },
      payload,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.metadata.code).toBe(201);
    expect(body.data.name).toBe('Upload Test Product');
    expect(body.data.image_url).toContain('https://ik.imagekit.io/mock');

    // Cleanup
    await db.delete(products).where(eq(products.id, body.data.id));
  });

  it('should reject invalid file type', async () => {
    const fakeFile = Buffer.from('not-an-image');
    const { payload, headers } = buildMultipartBody(
      {
        name: 'Bad File Product',
        price: '10.00',
        stock: '1',
        category_id: categoryId,
      },
      { filename: 'test.txt', contentType: 'text/plain', content: fakeFile },
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      cookies: { token: adminCookie },
      headers: {
        'content-type': headers['content-type'],
      },
      payload,
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.metadata.message).toContain('Tipe file tidak valid');
  });

  it('should truncate long slug and be accessible by slug', async () => {
    const longName = 'Sus Kering Coklat Lumer Enak '.repeat(6).trim();
    const create = await app.inject({
      method: 'POST',
      url: '/api/products',
      cookies: { token: adminCookie },
      payload: { name: longName, price: 10000, stock: 5, category_id: categoryId },
    });

    expect(create.statusCode).toBe(201);
    const created = JSON.parse(create.body);
    expect(created.data.slug.length).toBeLessThanOrEqual(100);

    const get = await app.inject({
      method: 'GET',
      url: `/api/products/slug/${created.data.slug}`,
    });

    expect(get.statusCode).toBe(200);

    await db.delete(products).where(eq(products.id, created.data.id));
  });

  it('should create a product via JSON without image', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      cookies: { token: adminCookie },
      payload: { name: 'JSON Product Unique', price: 50, stock: 3, category_id: categoryId },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.data.image_url).toBeNull();

    await db.delete(products).where(eq(products.id, body.data.id));
  });

  it('should allow product price of 0', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      cookies: { token: adminCookie },
      payload: { name: 'Free Product Unique', price: 0, stock: 1, category_id: categoryId },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.data.price).toBe(0);

    await db.delete(products).where(eq(products.id, body.data.id));
  });

  it('should reject invalid product price via JSON', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      cookies: { token: adminCookie },
      payload: { name: 'Bad Price Product', price: 'abc', stock: 1, category_id: categoryId },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should reject nonexistent category when creating product', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      cookies: { token: adminCookie },
      payload: { name: 'Bad Cat Product', price: 10, stock: 1, category_id: ulid() },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.metadata.message).toBe('Kategori tidak ditemukan.');
  });

  it('should reject invalid price on update', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/products',
      cookies: { token: adminCookie },
      payload: { name: 'Update Bad Price', price: 10, stock: 1, category_id: categoryId },
    });
    const productId = JSON.parse(create.body).data.id;

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/products/${productId}`,
      cookies: { token: adminCookie },
      payload: { price: 'xyz' },
    });

    expect(response.statusCode).toBe(400);

    await db.delete(products).where(eq(products.id, productId));
  });

  it('should return 404 for nonexistent category slug', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products/category/nonexistent-category-slug',
    });

    expect(response.statusCode).toBe(404);
  });

  it('should allow empty patch body without error', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/products',
      cookies: { token: adminCookie },
      payload: { name: 'Empty Patch Product', price: 10, stock: 1, category_id: categoryId },
    });
    const productId = JSON.parse(create.body).data.id;

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/products/${productId}`,
      cookies: { token: adminCookie },
      payload: {},
    });

    expect(response.statusCode).toBe(200);

    await db.delete(products).where(eq(products.id, productId));
  });

  it('should return 404 for nonexistent product on update', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/products/${ulid()}`,
      cookies: { token: adminCookie },
      payload: { name: 'Ghost Product' },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should exclude cancelled orders and out-of-stock products from best sellers', async () => {
    const userId = ulid();
    await db.insert(users).values({
      id: userId,
      email: 'best_seller_user_unique@example.com',
      password: await hashPassword('password'),
      name: 'Best Seller User',
      role: 'user',
    });

    const soldId = ulid();
    const outOfStockId = ulid();
    await db.insert(products).values([
      {
        id: soldId,
        categoryId,
        name: 'Sold Product Unique',
        slug: 'sold-product-unique',
        price: '50.00',
        stock: 5,
      },
      {
        id: outOfStockId,
        categoryId,
        name: 'Out Of Stock Unique',
        slug: 'out-of-stock-unique',
        price: '25.00',
        stock: 0,
      },
    ]);

    const validOrderId = ulid();
    const cancelledOrderId = ulid();
    await db.insert(orders).values([
      {
        id: validOrderId,
        userId,
        totalAmount: '50.00',
        status: 'delivered',
      },
      {
        id: cancelledOrderId,
        userId,
        totalAmount: '250.00',
        status: 'cancelled',
      },
    ]);

    await db.insert(orderItems).values([
      {
        id: ulid(),
        orderId: validOrderId,
        productId: soldId,
        quantity: 1,
        priceAtPurchase: '50.00',
      },
      {
        id: ulid(),
        orderId: cancelledOrderId,
        productId: soldId,
        quantity: 5,
        priceAtPurchase: '50.00',
      },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/products/best-sellers',
      query: { limit: '20' },
    });

    expect(response.statusCode).toBe(200);
    const soldProduct = JSON.parse(response.body).data.find(
      (p: any) => p.id === soldId,
    );
    expect(soldProduct).toBeDefined();
    expect(soldProduct.total_sold).toBe(1);
    expect(
      JSON.parse(response.body).data.find((p: any) => p.id === outOfStockId),
    ).toBeUndefined();

    await db.delete(orderItems).where(eq(orderItems.orderId, validOrderId));
    await db.delete(orderItems).where(eq(orderItems.orderId, cancelledOrderId));
    await db.delete(orders).where(eq(orders.id, validOrderId));
    await db.delete(orders).where(eq(orders.id, cancelledOrderId));
    await db.delete(products).where(eq(products.id, soldId));
    await db.delete(products).where(eq(products.id, outOfStockId));
    await db.delete(users).where(eq(users.id, userId));
  });

  it('should bulk create products with valid API key', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/products/bulk',
      headers: { 'x-api-key': 'test_bulk_key' },
      payload: [
        { name: 'Bulk Product One', price: 100, stock: 5, category_id: categoryId },
        { name: 'Bulk Product Two', price: 200, stock: 3, category_id: categoryId },
      ],
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.metadata.code).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.data.every((r: any) => r.status === 'success')).toBe(true);
    expect(body.data[0].product.name).toBe('Bulk Product One');

    await db.delete(products).where(eq(products.name, 'Bulk Product One'));
    await db.delete(products).where(eq(products.name, 'Bulk Product Two'));
  });

  it('should report per-item failure for invalid category', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/products/bulk',
      headers: { 'x-api-key': 'test_bulk_key' },
      payload: [
        { name: 'Bulk Valid Item', price: 50, stock: 2, category_id: categoryId },
        { name: 'Bulk Bad Item', price: 50, stock: 2, category_id: '01NONEXISTENT0000000000000' },
      ],
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data[0].status).toBe('success');
    expect(body.data[1].status).toBe('error');
    expect(body.data[1].message).toContain('Kategori tidak ditemukan');

    await db.delete(products).where(eq(products.name, 'Bulk Valid Item'));
  });

  it('should assign slug suffix for duplicate names in one batch', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/products/bulk',
      headers: { 'x-api-key': 'test_bulk_key' },
      payload: [
        { name: 'Duplicate Slug Bulk', price: 10, stock: 1, category_id: categoryId },
        { name: 'Duplicate Slug Bulk', price: 10, stock: 1, category_id: categoryId },
      ],
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.every((r: any) => r.status === 'success')).toBe(true);
    expect(body.data[0].product.slug).toBe('duplicate-slug-bulk');
    expect(body.data[1].product.slug).toBe('duplicate-slug-bulk-1');

    await db.delete(products).where(eq(products.slug, 'duplicate-slug-bulk'));
    await db.delete(products).where(eq(products.slug, 'duplicate-slug-bulk-1'));
  });

  it('should reject bulk request without API key', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/products/bulk',
      payload: [{ name: 'No Key Item', price: 10, stock: 1, category_id: categoryId }],
    });

    expect(response.statusCode).toBe(401);
  });

  it('should reject bulk request with wrong API key', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/products/bulk',
      headers: { 'x-api-key': 'wrong_key' },
      payload: [{ name: 'Wrong Key Item', price: 10, stock: 1, category_id: categoryId }],
    });

    expect(response.statusCode).toBe(401);
  });
});
