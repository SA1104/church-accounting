const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT name, birth_date, profile_image_url FROM politics_politicians WHERE name IN ('강국', '강동훈', '강민석')").then(r => {
  console.log(r.rows);
  pool.end();
});
