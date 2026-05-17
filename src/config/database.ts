import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { env } from './env.js';
import * as schema from '../db/schema.js';

// Connection pool configuration optimized for 2GB RAM server
// We limit the max connections to prevent OOM and database saturation
export const pool = mysql.createPool({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Adjust based on concurrent request load and RAM
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

export const db = drizzle(pool);
