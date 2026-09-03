const { Pool } = require('pg');
async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  const res1 = await client.query(`SELECT checkpoint_date FROM stock_ingestion_runs ORDER BY started_at DESC LIMIT 5`);
  console.log('Latest Checkpoints:', res1.rows);
  const res2 = await client.query(`SELECT trade_date FROM stock_daily_bars WHERE instrument_id = (SELECT id FROM stock_instruments WHERE stock_code = '375500')`);
  console.log('DL E&C Dates:', res2.rows);
  pool.end();
}
run();
