import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: 'Terlalu Banyak Permintaan',
      message: `Terlalu banyak permintaan. Maksimal ${context.max} permintaan per menit. Silakan tunggu sebentar.`,
    }),
  });
});
