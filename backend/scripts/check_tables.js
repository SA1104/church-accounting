const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const { pool } = require('../core/db');

async function run() {
  const res = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  console.log(res.rows.map(r => r.table_name));
  await pool.end();
}
run().catch(console.error);
