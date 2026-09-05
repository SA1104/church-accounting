const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'politics_%'").then(r => {
  console.log(r.rows);
  pool.end();
}).catch(console.error);
