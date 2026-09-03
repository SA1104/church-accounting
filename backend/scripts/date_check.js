const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
  const c = await pool.connect();
  try {
    const res = await c.query(`SELECT instrument_id, trade_date, trade_date::text as trade_date_str FROM stock_daily_bars LIMIT 5;`);
    console.log(res.rows);
  } finally {
    c.release();
    pool.end();
  }
}
check();
