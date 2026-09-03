const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env.development') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function query() {
  const client = await pool.connect();
  
  console.log('--- BACKFILL STATUS ---');
  
  const q1 = await client.query(`
    SELECT
      COUNT(*) AS total_rows,
      COUNT(DISTINCT trade_date) AS trading_days,
      MIN(trade_date) AS min_date,
      MAX(trade_date) AS max_date
    FROM stock_daily_bars;
  `);
  console.log('Overall:', q1.rows[0]);
  
  const q2 = await client.query(`
    SELECT 
      EXTRACT(YEAR FROM trade_date) as year, 
      COUNT(*) as rows 
    FROM stock_daily_bars 
    GROUP BY year 
    ORDER BY year DESC;
  `);
  console.log('By Year:', q2.rows);
  
  const q3 = await client.query(`
    SELECT status, COUNT(*) as count 
    FROM stock_ingestion_runs 
    GROUP BY status;
  `);
  console.log('Runs by Status:', q3.rows);

  const q4 = await client.query(`
    SELECT target_date, status, completed_at
    FROM stock_ingestion_runs 
    WHERE status = 'SUCCESS'
    ORDER BY target_date DESC
    LIMIT 1;
  `);
  console.log('Latest SUCCESS checkpoint:', q4.rows[0]);
  
  client.release();
  pool.end();
}

query().catch(e => { console.error(e); pool.end(); });
