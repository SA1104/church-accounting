const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const { pool } = require('../core/db');

async function run() {
  await pool.query(`
    INSERT INTO finance_assets (asset_type, name, provider, expiration_date, auto_renew, annual_cost_krw)
    VALUES ('SAAS', 'NAVER API HUB (News API)', 'NAVER Cloud Platform (NCP)', '2027-06-30', true, 0)
  `);
  console.log('Added NAVER API HUB to Finance Dashboard');
  await pool.end();
}
run().catch(console.error);
