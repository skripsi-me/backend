import fp from 'fastify-plugin';
import { type FastifyPluginAsync, type FastifyReply, type FastifyRequest } from 'fastify';
import { formatError } from '../shared/utils/response.util.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    adminOnly: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string; role: string };
    user: { id: string; email: string; role: string };
  }
}

const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      request.log.warn({ err }, 'JWT verification failed');
      return reply.status(401).send(formatError(401, 'Invalid or missing token'));
    }
  });

  fastify.decorate('adminOnly', async (request: FastifyRequest, reply: FastifyReply) => {
    await fastify.authenticate(request, reply);
    if (reply.sent) return;

    if (request.user?.role !== 'admin') {
      request.log.warn({ userId: request.user?.id }, 'Non-admin user attempted admin access');
      return reply.status(403).send(formatError(403, 'Admin access required'));
    }
  });
});

export default authPlugin;
