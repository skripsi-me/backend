import mysql from 'mysql2/promise';
import 'dotenv/config';

async function setupFulltext() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    console.log('Adding FULLTEXT indexes...');
    await connection.query('ALTER TABLE products ADD FULLTEXT INDEX name_fulltext_idx (name)');
    await connection.query('ALTER TABLE products ADD FULLTEXT INDEX desc_fulltext_idx (description)');
    console.log('✅ FULLTEXT indexes added successfully.');
  } catch (err) {
    console.error('❌ Failed to add FULLTEXT indexes:', err.message);
  } finally {
    await connection.end();
  }
}

setupFulltext();
