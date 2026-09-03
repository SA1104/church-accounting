const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });

async function fixRoles() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Fix schema creation
    await client.query('REVOKE CREATE ON SCHEMA public FROM public');
    await client.query('REVOKE CREATE ON SCHEMA public FROM stock_app_readonly');
    await client.query('REVOKE CREATE ON SCHEMA public FROM stock_ingestion_writer');
    
    // Explicitly revoke all DML from readonly
    await client.query('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM stock_app_readonly');
    
    await client.query('COMMIT');
    console.log('Roles fixed successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}
fixRoles();
