import { defineConfig } from 'drizzle-kit';
import { env } from './src/config/env.js';

const isTiDB = env.DATABASE_PORT === 4000 || env.DATABASE_HOST.includes('tidbcloud');

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    user: env.DATABASE_USER,
    ...(env.DATABASE_PASSWORD ? { password: env.DATABASE_PASSWORD } : {}),
    database: env.DATABASE_NAME,
    ...(isTiDB ? { ssl: '{"rejectUnauthorized":true}' } : {}),
  },
});
