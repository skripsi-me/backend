import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(rateLimit, {
    max: 20,
    timeWindow: '1 second',
    // We can customize the keyGenerator if needed, but default is IP
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Maximum ${context.max} requests per ${context.after} allowed.`,
    }),
  });
});
