require('dotenv').config({ path: 'backend/.env.development' });
const { Pool } = require('pg');

async function checkDb() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT COUNT(*) as c FROM politics_trends');
    console.log('Total politics_trends rows:', res.rows[0].c);
    
    if (res.rows[0].c > 0) {
      const sample = await pool.query('SELECT * FROM politics_trends ORDER BY record_date DESC LIMIT 5');
      console.log('Latest trends:');
      console.log(sample.rows);
    } else {
      console.log('No data yet.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkDb();
