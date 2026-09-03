const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createTable() {
  try {
    console.log('Creating system_cron_logs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_cron_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        message TEXT,
        execution_time NUMERIC,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_system_cron_logs_job_date 
      ON system_cron_logs(job_name, created_at DESC);
    `);

    console.log('Table system_cron_logs created successfully.');
  } catch (err) {
    console.error('Failed to create table:', err);
  } finally {
    pool.end();
  }
}

createTable();
