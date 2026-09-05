const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env.development') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const q1 = await pool.query(`SELECT COUNT(*) as c FROM politics_politicians`);
    console.log('q1', q1.rows[0]);
    const q2 = await pool.query(`SELECT COUNT(*) as c FROM politics_trends`);
    console.log('q2', q2.rows[0]);
    const q3 = await pool.query(`SELECT COUNT(*) as c FROM insight_candidates`);
    console.log('q3', q3.rows[0]);
    const q4 = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success
      FROM system_cron_logs
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    console.log('q4', q4.rows[0]);
  } catch (err) {
    console.error(err.message);
  } finally {
    pool.end();
  }
}

run();
