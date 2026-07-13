import mysql from 'mysql2/promise';
import 'dotenv/config';

async function setupFulltext() {
  const port = Number(process.env.DATABASE_PORT) || 3306;
  const host = process.env.DATABASE_HOST;
  const isTiDB = port === 4000 || host?.includes('tidbcloud');

  const connection = await mysql.createConnection({
    host,
    port,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ...(isTiDB ? { ssl: { rejectUnauthorized: true } } : {}),
  });

  try {
    console.log('Adding FULLTEXT indexes...');
    await connection.query('ALTER TABLE products ADD FULLTEXT INDEX name_fulltext_idx (name)');
    await connection.query('ALTER TABLE products ADD FULLTEXT INDEX desc_fulltext_idx (description)');
    console.log('FULLTEXT indexes added successfully.');
  } catch (err) {
    console.error('Failed to add FULLTEXT indexes:', err.message);
  } finally {
    await connection.end();
  }
}

setupFulltext();
