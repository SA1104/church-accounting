const { Pool } = require('pg');
require('dotenv').config({path: '.env.development'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
  const count = await pool.query("SELECT COUNT(*) FROM stock_instruments");
  const kospi = await pool.query("SELECT COUNT(*) FROM stock_instruments WHERE primary_market_code='KRX_KOSPI'");
  const kosdaq = await pool.query("SELECT COUNT(*) FROM stock_instruments WHERE primary_market_code='KRX_KOSDAQ'");
  const dup = await pool.query("SELECT COUNT(*) FROM (SELECT stock_code, COUNT(*) FROM stock_instruments GROUP BY stock_code HAVING COUNT(*) > 1) d");
  const nullCode = await pool.query("SELECT COUNT(*) FROM stock_instruments WHERE stock_code IS NULL OR stock_code = ''");
  const nullName = await pool.query("SELECT COUNT(*) FROM stock_instruments WHERE instrument_name IS NULL OR instrument_name = ''");
  const nullMarket = await pool.query("SELECT COUNT(*) FROM stock_instruments WHERE primary_market_code IS NULL");
  const badDate = await pool.query("SELECT COUNT(*) FROM stock_instruments WHERE listing_date > '2100-01-01' OR listing_date < '1900-01-01'");
  const samsung = await pool.query("SELECT stock_code, instrument_name, security_type FROM stock_instruments WHERE stock_code IN ('005930', '005935') ORDER BY stock_code");
  console.log(JSON.stringify({
    total: count.rows[0].count,
    kospi: kospi.rows[0].count,
    kosdaq: kosdaq.rows[0].count,
    dup: dup.rows[0].count,
    nullCode: nullCode.rows[0].count,
    nullName: nullName.rows[0].count,
    nullMarket: nullMarket.rows[0].count,
    badDate: badDate.rows[0].count,
    samsung: samsung.rows
  }, null, 2));
  pool.end();
}
check();
