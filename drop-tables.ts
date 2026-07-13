import mysql from 'mysql2/promise';
import { env } from './src/config/env.js';

async function main() {
  const connection = await mysql.createConnection({
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD || '',
    database: env.DATABASE_NAME,
  });

  console.log('Connected to database');

  const [tables] = await connection.query('SHOW TABLES') as [any[], any];
  const tableNames = tables.map((row) => Object.values(row)[0]);
  if (tableNames.length > 0) {
    console.log(`Dropping tables: ${tableNames.join(', ')}`);
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const tableName of tableNames) {
      await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('All tables dropped');
  } else {
    console.log('No tables to drop');
  }

  await connection.end();
}

main().catch(console.error);
