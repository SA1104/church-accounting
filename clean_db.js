const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('DELETE FROM politics_politicians WHERE birth_date IS NULL').then(r => {
  console.log('Deleted rows:', r.rowCount);
  pool.end();
});
