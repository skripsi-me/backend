import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';

export default fp(async (fastify: FastifyInstance) => {
  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: true,
  });

  // CORS configuration
  await fastify.register(cors, {
    // ponytail: no allowlist → reflect-all in dev, no CORS headers in prod.
    // Tighten when a fixed frontend origin is known.
    origin: env.CORS_ORIGINS
      ? env.CORS_ORIGINS.split(',').map((o) => o.trim())
      : env.NODE_ENV !== 'production',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
});
