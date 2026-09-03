const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });

async function fixAndTest() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('REVOKE ALL ON SCHEMA public FROM PUBLIC');
    await client.query('GRANT USAGE ON SCHEMA public TO PUBLIC');
    // Ensure read-only has strictly SELECT
    await client.query('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM stock_app_readonly');
    await client.query('GRANT SELECT ON ALL TABLES IN SCHEMA public TO stock_app_readonly');
  } finally {
    client.release();
    pool.end();
  }

  const url = process.env.DATABASE_URL.replace(/postgres:\/\/[^:]+:[^@]+@/, 'postgres://stock_app_readonly:reader_pass@');
  const readPool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  const rClient = await readPool.connect();
  
  console.log('--- stock_app_readonly TEST ---');
  try { await rClient.query('SELECT 1 FROM stock_daily_bars LIMIT 1'); console.log('SELECT: OK'); } catch(e) { console.log('SELECT:', e.code, e.message); }
  try { await rClient.query("INSERT INTO stock_markets (market_code, country_code, name) VALUES ('T1', 'KR', 'T')"); console.log('INSERT: FAIL_SECURITY (bad)'); } catch(e) { console.log('INSERT:', e.code, e.message); }
  try { await rClient.query("UPDATE stock_instruments SET is_active=false"); console.log('UPDATE: FAIL_SECURITY (bad)'); } catch(e) { console.log('UPDATE:', e.code, e.message); }
  try { await rClient.query("DELETE FROM stock_daily_bars"); console.log('DELETE: FAIL_SECURITY (bad)'); } catch(e) { console.log('DELETE:', e.code, e.message); }
  try { await rClient.query("CREATE TABLE test_table_r2 (id int)"); console.log('CREATE TABLE: FAIL_SECURITY (bad)'); } catch(e) { console.log('CREATE TABLE:', e.code, e.message); }

  rClient.release();
  await readPool.end();
}
fixAndTest();
