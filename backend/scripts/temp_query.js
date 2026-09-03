const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const res = await pool.query('SELECT COUNT(*) FROM market_insights');
  console.log('Total insights:', res.rows[0].count);
  pool.end();
}
run();
