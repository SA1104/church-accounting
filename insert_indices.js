const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  try {
    await pool.query(`
      INSERT INTO stock_indices (index_code, index_name, country_code, market_code, currency_code, source_id, is_active)
      VALUES 
      ('KRX_KOSPI_IDX', 'KOSPI', 'KR', 'KRX_KOSPI', 'KRW', (SELECT id FROM stock_data_sources WHERE source_code='KRX_OPEN_API'), true),
      ('KRX_KOSDAQ_IDX', 'KOSDAQ', 'KR', 'KRX_KOSDAQ', 'KRW', (SELECT id FROM stock_data_sources WHERE source_code='KRX_OPEN_API'), true)
      ON CONFLICT DO NOTHING;
    `);
    console.log('Indices inserted.');
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}
run();
