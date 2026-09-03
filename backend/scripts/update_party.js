const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../scratch/church-accounting/backend/.env.development') });
const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log('Adding party_name column...');
    await pool.query(`ALTER TABLE politics_politicians ADD COLUMN IF NOT EXISTS party_name VARCHAR(100)`);
    
    console.log('Updating politicians with party data...');
    await pool.query(`UPDATE politics_politicians SET party_name = '더불어민주당' WHERE name = '이재명'`);
    await pool.query(`UPDATE politics_politicians SET party_name = '국민의힘' WHERE name = '한동훈'`);
    await pool.query(`UPDATE politics_politicians SET party_name = '국민의힘' WHERE name = '안철수'`);
    
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}
run();
