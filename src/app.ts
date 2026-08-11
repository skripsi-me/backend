import Fastify, { type FastifyError } from 'fastify';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import securityPlugin from './plugins/security.plugin.js';
import rateLimitPlugin from './plugins/rate-limit.plugin.js';
import swaggerPlugin from './plugins/swagger.plugin.js';
import authPlugin from './plugins/auth.plugin.js';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { categoriesRoutes } from './modules/categories/categories.routes.js';
import { productsRoutes } from './modules/products/products.routes.js';
import { cartsRoutes } from './modules/carts/carts.routes.js';
import { ordersRoutes } from './modules/orders/orders.routes.js';
import { formatError, formatSuccess } from './shared/utils/response.util.js';

declare module 'fastify' {
  interface FastifyReply {
    success<T>(data: T, message?: string): FastifyReply;
  }
}

const validationMessageMap: Array<[RegExp, string]> = [
  [/must be valid email/i, 'harus berupa email yang valid.'],
  [/must be string/i, 'harus berupa teks.'],
  [/must be number/i, 'harus berupa angka.'],
  [/must be integer/i, 'harus berupa bilangan bulat.'],
  [/must be boolean/i, 'harus berupa nilai benar atau salah.'],
  [/must not be empty/i, 'tidak boleh kosong.'],
  [/must have at least (\d+) characters/i, 'minimal harus $1 karakter.'],
  [/must have at most (\d+) characters/i, 'maksimal $1 karakter.'],
  [/must be >= ([\d.]+)/i, 'minimal $1.'],
  [/must be <= ([\d.]+)/i, 'maksimal $1.'],
  [/must be > ([\d.]+)/i, 'harus lebih dari $1.'],
  [/must be < ([\d.]+)/i, 'harus kurang dari $1.'],
  [/must be equal to one of the allowed values/i, 'harus salah satu dari nilai yang diizinkan.'],
  [/must match exactly one schema in oneOf/i, 'nilai tidak sesuai dengan ketentuan yang diizinkan.'],
  [/Required/i, 'wajib diisi.'],
  [/^Expected/i, 'nilai tidak sesuai dengan ketentuan yang diizinkan.'],
];

function translateValidationMessage(message: string): string {
  for (const [pattern, translation] of validationMessageMap) {
    const match = message.match(pattern);
    if (match) {
      return message.replace(pattern, translation);
    }
  }
  return message;
}

export const buildApp = async () => {
  const isProduction = env.NODE_ENV === 'production';

  const app = Fastify({
    logger: isProduction
      ? true
      : {
          transport: {
            target: 'pino-pretty',
          },
        },
    trustProxy: env.TRUST_PROXY,
    maxParamLength: 255,
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Decorate Reply for standardized success response
  app.decorateReply('success', function (this: any, data: any, message?: string) {
    return this.send(formatSuccess(this, data, message));
  });

  // Global Error Handler
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    const statusCode = error.statusCode || 500;
    const message =
      statusCode >= 500
        ? 'Terjadi kesalahan pada server. Silakan coba lagi.'
        : error.message;

    // Handle Validation Errors
    if (error.validation) {
      const validationErrors: Record<string, string> = {};
      error.validation.forEach((err: any) => {
        // Extract the field name from instancePath or params
        const field =
          err.instancePath.replace(/^\//, '') ||
          (err.params && 'missingProperty' in err.params
            ? String(err.params.missingProperty)
            : 'unknown');
        validationErrors[field] = translateValidationMessage(err.message) || 'Nilai tidak valid';
      });

      return reply
        .status(400)
        .send(formatError(400, 'Data yang dikirim tidak valid. Periksa kembali isian Anda.', validationErrors));
    }

    // Log unexpected errors
    if (statusCode >= 500) {
      app.log.error(error);
    }

    const frameworkMessages: Record<number, string> = {
      404: 'Halaman tidak ditemukan.',
      413: 'Ukuran file terlalu besar. Maksimal 5MB.',
      415: 'Format data tidak didukung. Gunakan JSON atau multipart/form-data.',
    };

    return reply
      .status(statusCode)
      .send(formatError(statusCode, frameworkMessages[statusCode] || message));
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send(formatError(404, 'Halaman tidak ditemukan.'));
  });

  // Register Global Plugins
  await app.register(securityPlugin);
  await app.register(rateLimitPlugin);
  await app.register(swaggerPlugin);

  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
    hook: 'onRequest',
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: 'token',
      signed: true,
    },
  });

  await app.register(multipart, {
    attachFieldsToBody: true,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });

  await app.register(authPlugin);

  // Register Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(categoriesRoutes, { prefix: '/api/categories' });
  await app.register(productsRoutes, { prefix: '/api/products' });
  await app.register(cartsRoutes, { prefix: '/api/carts' });
  await app.register(ordersRoutes, { prefix: '/api/orders' });

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  return app;
};
