import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import { db } from '../../../config/database.js';
import { categories, users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { hashPassword } from '../../../shared/utils/hash.util.js';
import { type FastifyInstance } from 'fastify';

describe('Categories Module', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  const adminEmail = 'admin_cat_unique@example.com';

  beforeAll(async () => {
    app = await buildApp();
    
    // Create admin user for tests
    const adminId = ulid();
    const hashedPassword = await hashPassword('password');
    await db.insert(users).values({
      id: adminId,
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin Category',
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
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, adminEmail));
    await db.delete(categories).where(eq(categories.slug, 'test-category-unique'));
  });

  it('should create a new category (admin only)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/categories',
      cookies: { token: adminCookie },
      payload: {
        name: 'Test Category Unique',
        slug: 'test-category-unique',
        description: 'Test Description',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.metadata.code).toBe(201);
    expect(body.data.name).toBe('Test Category Unique');
  });

  it('should get all categories', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/categories',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.metadata.code).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.some((c: any) => c.slug === 'test-category-unique')).toBe(true);
  });
});
