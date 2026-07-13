import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

let app: FastifyInstance | undefined;

async function getApp(): Promise<FastifyInstance> {
  if (!app) {
    app = await buildApp();
  }
  return app;
}

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  const appInstance = await getApp();

  // Convert Vercel request to Node.js request
  const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);

  // Handle the request
  const reply = await appInstance.inject({
    method: req.method as any,
    url: url.pathname + url.search,
    headers: req.headers as Record<string, string>,
    payload: req.body,
  });

  // Send response
  res.statusCode = reply.statusCode;

  // Set headers
  const headers = reply.headers;
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) {
        res.setHeader(key, value);
      }
    }
  }

  res.end(reply.body);
}
