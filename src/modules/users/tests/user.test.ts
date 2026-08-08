import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import { db } from '../../../config/database.js';
import { users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { hashPassword } from '../../../shared/utils/hash.util.js';
import { type FastifyInstance } from 'fastify';

describe('User Module', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let userCookie: string;
  let userId: string;

  beforeAll(async () => {
    app = await buildApp();
    
    // Create admin
    const adminId = ulid();
    const adminHashedPassword = await hashPassword('password');
    await db.insert(users).values({
      id: adminId,
      email: 'user_test_admin@example.com',
      password: adminHashedPassword,
      name: 'Admin',
      role: 'admin',
    });

    const adminLoginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'user_test_admin@example.com', password: 'password' },
    });
    adminCookie = adminLoginResponse.cookies.find((c) => c.name === 'token')!.value;

    // Create a normal user
    userId = ulid();
    const userHashedPassword = await hashPassword('password');
    await db.insert(users).values({
      id: userId,
      email: 'user_test_normal@example.com',
      password: userHashedPassword,
      name: 'User',
      role: 'user',
    });

    const userLoginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'user_test_normal@example.com', password: 'password' },
    });
    userCookie = userLoginResponse.cookies.find((c) => c.name === 'token')!.value;
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, 'user_test_admin@example.com'));
    await db.delete(users).where(eq(users.email, 'user_test_normal@example.com'));
  });

  it('should get current user profile', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/users/me',
      cookies: { token: userCookie },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.email).toBe('user_test_normal@example.com');
  });

  it('should list all users (admin only)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/users',
      cookies: { token: adminCookie },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.metadata.code).toBe(200);
    expect(Array.isArray(body.data.data)).toBe(true);
    expect(body.data.data.length).toBeGreaterThanOrEqual(2);
    expect(body.data.meta).toHaveProperty('total');
    expect(body.data.meta).toHaveProperty('page');
    expect(body.data.meta).toHaveProperty('limit');
    expect(body.data.meta).toHaveProperty('total_pages');
  });

  it('should fail to list all users if not admin', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/users',
      cookies: { token: userCookie },
    });

    expect(response.statusCode).toBe(403);
  });
});
