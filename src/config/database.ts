import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { env } from './env.js';
import * as schema from '../db/schema.js';

// Detect TiDB Cloud (port 4000 or host contains 'tidbcloud')
const isTiDB = env.DATABASE_PORT === 4000 || env.DATABASE_HOST.includes('tidbcloud');

const poolConfig: mysql.PoolOptions = {
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD || '',
  database: env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ...(isTiDB ? { ssl: { rejectUnauthorized: true } } : {}),
};

export const pool = mysql.createPool(poolConfig);

export const db = drizzle(pool);
