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
    origin: env.CORS_ORIGINS
      ? env.CORS_ORIGINS.split(',').map((o) => o.trim())
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
});
