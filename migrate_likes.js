const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await pool.query(`
    ALTER TABLE politics_politicians 
    ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS politics_parties (
      name VARCHAR(255) PRIMARY KEY,
      likes INTEGER DEFAULT 0,
      dislikes INTEGER DEFAULT 0
    );
  `);
  
  console.log('Migrated politicians and parties likes schema!');
  pool.end();
}

migrate().catch(console.error);
