const { Pool } = require('pg'); 
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({connectionString: process.env.DATABASE_URL}); 
pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE '%view%' OR table_name LIKE '%analytic%' OR table_name LIKE '%traffic%' OR table_name LIKE '%visit%')").then(r => {console.log(r.rows); process.exit(0)}).catch(console.error);
