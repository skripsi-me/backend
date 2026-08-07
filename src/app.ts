import Fastify, { type FastifyError } from 'fastify';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import securityPlugin from './plugins/security.plugin.js';
import rateLimitPlugin from './plugins/rate-limit.plugin.js';
import swaggerPlugin from './plugins/swagger.plugin.js';
import authPlugin from './plugins/auth.plugin.js';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
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
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Decorate Reply for standardized success response
  app.decorateReply('success', function (this: any, data: any, message?: string) {
    return this.send(formatSuccess(this, data, message));
  });

  // Global Error Handler
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    const statusCode = error.statusCode || 500;
    const message = statusCode >= 500 ? 'Internal Server Error' : error.message;

    // Handle Validation Errors
    if (error.validation) {
      const validationErrors: Record<string, string> = {};
      error.validation.forEach((err: any) => {
        // Extract the field name from instancePath or params
        const field = err.instancePath.replace(/^\//, '') || 
                     (err.params && 'missingProperty' in err.params ? String(err.params.missingProperty) : 'unknown');
        validationErrors[field] = err.message || 'Invalid value';
      });

      return reply.status(400).send(formatError(400, 'Validation Error', validationErrors));
    }

    // Log unexpected errors
    if (statusCode >= 500) {
      app.log.error(error);
    }

    return reply.status(statusCode).send(formatError(statusCode, message));
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
