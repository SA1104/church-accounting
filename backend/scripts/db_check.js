const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
  const c = await pool.connect();
  try {
    const q1 = await c.query(`SELECT COUNT(*) AS total_rows, COUNT(DISTINCT trade_date) AS trading_days, MIN(trade_date) AS min_date, MAX(trade_date) AS max_date FROM stock_daily_bars;`);
    console.log('Query 1:', q1.rows[0]);
    const q2 = await c.query(`SELECT COUNT(*) FROM stock_instruments WHERE stock_code = '375500';`);
    console.log('Query 2:', q2.rows[0]);
    const q3 = await c.query(`SELECT COUNT(*) FROM stock_daily_bars b JOIN stock_instruments i ON i.id = b.instrument_id WHERE i.stock_code = '375500';`);
    console.log('Query 3:', q3.rows[0]);
  } catch (e) {
    console.error(e);
  } finally {
    c.release();
    pool.end();
  }
}
check();
