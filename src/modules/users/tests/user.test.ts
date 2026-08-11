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
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
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
      createdAt: new Date('2025-06-01T00:00:00.000Z'),
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

  it('should sort users by created_at ascending', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/users',
      query: { sort: 'asc' },
      cookies: { token: adminCookie },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    const emails = body.data.data.map((u: any) => u.email);
    expect(emails.indexOf('user_test_admin@example.com')).toBeLessThan(
      emails.indexOf('user_test_normal@example.com'),
    );
  });

  it('should sort users by created_at descending', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/users',
      query: { sort: 'desc' },
      cookies: { token: adminCookie },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    const emails = body.data.data.map((u: any) => u.email);
    expect(emails.indexOf('user_test_normal@example.com')).toBeLessThan(
      emails.indexOf('user_test_admin@example.com'),
    );
  });

  it('should handle empty profile patch without error', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/users/me',
      cookies: { token: userCookie },
      payload: {},
    });

    expect(response.statusCode).toBe(200);
  });

  it('should allow clearing phone_number', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/users/me',
      cookies: { token: userCookie },
      payload: { phone_number: '' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.phone_number).toBeNull();
  });

  it('should reject admin updating email to an existing user', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/users/${userId}`,
      cookies: { token: adminCookie },
      payload: { email: 'user_test_admin@example.com' },
    });

    expect(response.statusCode).toBe(409);
  });

  it('should return 404 for /me when user was deleted', async () => {
    const tempId = ulid();
    await db.insert(users).values({
      id: tempId,
      email: 'deleted_user_test@example.com',
      password: await hashPassword('password'),
      name: 'Temp Deleted',
    });

    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'deleted_user_test@example.com', password: 'password' },
    });
    const token = login.cookies.find((c: any) => c.name === 'token')!.value;

    await db.delete(users).where(eq(users.id, tempId));

    const response = await app.inject({
      method: 'GET',
      url: '/api/users/me',
      cookies: { token },
    });

    expect(response.statusCode).toBe(404);
  });
});
