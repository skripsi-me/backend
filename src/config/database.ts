import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { env } from './env.js';
import * as schema from '../db/schema.js';

// Parse TiDB connection string or use individual env vars
function parseConnectionString(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace('/', ''),
  };
}

// Determine connection config
const dbConfig = env.DATABASE_URL
  ? parseConnectionString(env.DATABASE_URL)
  : {
      host: env.DATABASE_HOST!,
      port: env.DATABASE_PORT!,
      user: env.DATABASE_USER!,
      password: env.DATABASE_PASSWORD || '',
      database: env.DATABASE_NAME!,
    };

// Connection pool configuration
// For Vercel serverless, use smaller pool size
// For traditional server, use larger pool
const isServerless = !!env.DATABASE_URL || env.NODE_ENV === 'production';

const poolConfig: mysql.PoolOptions = {
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: isServerless ? 5 : 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

// Add SSL for TiDB
if (env.DATABASE_URL) {
  poolConfig.ssl = { rejectUnauthorized: true };
}

export const pool = mysql.createPool(poolConfig);

export const db = drizzle(pool);
