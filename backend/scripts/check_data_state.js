const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
  try {
    let r = await p.query("SELECT COUNT(*) FROM stock_instruments");
    console.log("COUNT instruments:", r.rows[0].count);
    
    r = await p.query("SELECT COUNT(*) FROM stock_daily_bars");
    console.log("COUNT daily_bars:", r.rows[0].count);
    
    r = await p.query("SELECT MAX(trade_date) FROM stock_index_daily_bars");
    console.log("MAX index_daily_bars:", r.rows[0].max);

    r = await p.query("SELECT COUNT(*) FROM stock_index_daily_bars");
    console.log("COUNT index_daily_bars:", r.rows[0].count);
    
    r = await p.query(`SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size`);
    console.log("DB Size:", r.rows[0].database_size);
  } catch (e) {
    console.error(e);
  } finally {
    p.end();
  }
}
check();
