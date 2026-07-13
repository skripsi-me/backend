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

  const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);

  // Build inject payload
  let payload: string | undefined;
  if (req.body !== undefined && req.body !== null) {
    payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  // Ensure content-type is set for body requests
  const headers: Record<string, string> = { ...req.headers };
  if (payload && !headers['content-type']) {
    headers['content-type'] = 'application/json';
  }

  const reply = await appInstance.inject({
    method: req.method as any,
    url: url.pathname + url.search,
    headers,
    payload,
  });

  res.statusCode = reply.statusCode;

  const replyHeaders = reply.headers;
  if (replyHeaders) {
    for (const [key, value] of Object.entries(replyHeaders)) {
      if (value !== undefined) {
        res.setHeader(key, value);
      }
    }
  }

  res.end(reply.body);
}
