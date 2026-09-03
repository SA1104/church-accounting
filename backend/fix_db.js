const { Pool } = require('pg');
require('dotenv').config({path: '.env.development'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function fix() {
  const res = await pool.query("SELECT stock_code, instrument_name FROM stock_instruments WHERE RIGHT(stock_code, 1) != '0' LIMIT 5");
  console.log('Preferred?', res.rows);
  
  // Safe update: If stock_code does not end with '0', it is a PREFERRED stock.
  const updateRes = await pool.query("UPDATE stock_instruments SET security_type = 'PREFERRED' WHERE RIGHT(stock_code, 1) != '0' AND security_type = 'COMMON'");
  console.log('Updated rows:', updateRes.rowCount);
  pool.end();
}
fix();
