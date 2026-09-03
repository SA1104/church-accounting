const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const sql = fs.readFileSync('database/verification/production_stock_instruments_payload_v4_1.sql', 'utf8');
  const lines = sql.split('\n');
  const insertStmt = lines.find(l => l.startsWith('INSERT INTO public.stock_instruments'));
  
  if (!insertStmt) return console.log('Not found');

  const createTable = `
    CREATE TEMP TABLE _v4_staging (
      stock_code VARCHAR(50),
      instrument_name VARCHAR(255),
      primary_market_code VARCHAR(20),
      security_type VARCHAR(50),
      listing_date DATE
    );
  `;
  
  const inserts = lines.filter(l => l.startsWith('INSERT INTO _v4_staging')).join('\n');
  
  try {
    await pool.query(createTable);
    await pool.query(inserts);
    await pool.query(insertStmt);
    console.log('Successfully inserted into stock_instruments');
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
