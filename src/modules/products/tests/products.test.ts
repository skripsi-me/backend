import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import { db } from '../../../config/database.js';
import { products, categories, users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { hashPassword } from '../../../shared/utils/hash.util.js';
import { type FastifyInstance } from 'fastify';

function buildMultipartBody(fields: Record<string, string>, file?: { filename: string; contentType: string; content: Buffer }) {
  const boundary = '----TestBoundary' + ulid();
  const parts: Buffer[] = [];

  for (const [key, value] of Object.entries(fields)) {
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
    ));
  }

  if (file) {
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`
    ));
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
      },
      {
        id: ulid(),
        name: 'Mechanical Keyboard Unique',
        slug: 'mechanical-keyboard-unique',
        description: 'RGB backlit mechanical keyboard with blue switches',
        price: '150.00',
        stock: 50,
        categoryId,
      }
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
      query: { page: '1', limit: '1' }
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
      query: { search: 'gaming' }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.metadata.code).toBe(200);
    expect(body.data.data.some((p: any) => p.name.toLowerCase().includes('gaming'))).toBe(true);
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
      { filename: 'test.jpg', contentType: 'image/jpeg', content: fakeImage }
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
      { filename: 'test.txt', contentType: 'text/plain', content: fakeFile }
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
    expect(body.metadata.message).toContain('Invalid file type');
  });
});
