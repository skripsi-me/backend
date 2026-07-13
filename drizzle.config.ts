import { defineConfig } from 'drizzle-kit';
import { env } from './src/config/env.js';

// Parse TiDB connection string if available
function parseDbUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace('/', ''),
  };
}

const dbCredentials = env.DATABASE_URL
  ? parseDbUrl(env.DATABASE_URL)
  : {
      host: env.DATABASE_HOST!,
      port: env.DATABASE_PORT!,
      user: env.DATABASE_USER!,
      ...(env.DATABASE_PASSWORD ? { password: env.DATABASE_PASSWORD } : {}),
      database: env.DATABASE_NAME!,
    };

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials,
});
