import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import { db } from '../../../config/database.js';
import { users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { type FastifyInstance } from 'fastify';

describe('Auth Module', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, 'auth_test@example.com'));
  });

  it('should register a new user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'auth_test@example.com',
        password: 'password123',
        name: 'Auth Test',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.metadata.code).toBe(201);
    expect(body.data.email).toBe('auth_test@example.com');
  });

  it('should login a user and set cookies', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'auth_test@example.com',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.cookies.some((c) => c.name === 'token')).toBe(true);
    expect(response.cookies.some((c) => c.name === 'refresh_token')).toBe(true);
    const body = JSON.parse(response.body);
    expect(body.data.status).toBe('ok');
  });

  it('should refresh the token', async () => {
    // Login to get refresh_token
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'auth_test@example.com',
        password: 'password123',
      },
    });

    const refreshToken = loginResponse.cookies.find((c) => c.name === 'refresh_token')!;

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      cookies: {
        refresh_token: refreshToken.value,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.cookies.some((c) => c.name === 'token')).toBe(true);
  });
});
