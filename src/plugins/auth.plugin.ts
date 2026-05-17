import fp from 'fastify-plugin';
import { type FastifyPluginAsync, type FastifyReply, type FastifyRequest } from 'fastify';

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
      reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or missing token',
        statusCode: 401,
      });
    }
  });

  fastify.decorate('adminOnly', async (request: FastifyRequest, reply: FastifyReply) => {
    await fastify.authenticate(request, reply);
    
    if (request.user?.role !== 'admin') {
      reply.status(403).send({
        error: 'Forbidden',
        message: 'Admin access required',
        statusCode: 403,
      });
    }
  });
});

export default authPlugin;
