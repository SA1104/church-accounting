const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });

async function testReal() {
  const match = process.env.DATABASE_URL.match(/postgres(?:ql)?:\/\/[^\.]+([^:]+)/);
  const projectRef = match ? match[1] : '';
  const url = process.env.DATABASE_URL.replace(/postgres(?:ql)?:\/\/[^:]+:[^@]+@/, `postgresql://stock_app_readonly${projectRef}:reader_pass@`);
  
  console.log('Testing with URL:', url.replace(/:[^:@]+@/, ':***@'));
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const res = await client.query('SELECT instrument_id FROM stock_daily_bars LIMIT 1');
    const id = res.rows.length > 0 ? res.rows[0].instrument_id : null;
    
    if (id) {
      await client.query(`UPDATE stock_daily_bars SET close_price=0 WHERE instrument_id=$1`, [id]);
      console.log('UPDATE 성공! (이러면 안됨)');
    } else {
      console.log('UPDATE 테스트 불가 (데이터 없음)');
    }
  } catch(e) {
    console.log('UPDATE 에러 (OK):', e.code, e.message);
  }
  
  try {
    const res = await client.query('SELECT instrument_id FROM stock_daily_bars LIMIT 1');
    const id = res.rows.length > 0 ? res.rows[0].instrument_id : null;
    if (id) {
      await client.query(`DELETE FROM stock_daily_bars WHERE instrument_id=$1`, [id]);
      console.log('DELETE 성공! (이러면 안됨)');
    }
  } catch(e) {
    console.log('DELETE 에러 (OK):', e.code, e.message);
  }
  
  try {
    await client.query("CREATE TABLE test_table_r3 (id int)");
    console.log('CREATE TABLE 성공! (이러면 안됨)');
  } catch(e) {
    console.log('CREATE TABLE 에러 (OK):', e.code, e.message);
  }
  
  await client.query('ROLLBACK');
  client.release();
  await pool.end();
}
testReal();
