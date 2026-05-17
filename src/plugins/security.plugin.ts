import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';

export default fp(async (fastify: FastifyInstance) => {
  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: true,
  });

  // CORS configuration
  await fastify.register(cors, {
    origin: true, // In production, this should be specific domains
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
});
