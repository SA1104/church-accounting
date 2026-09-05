const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("DELETE FROM politics_politicians WHERE name NOT IN ('안철수', '이재명', '조국', '이준석', '오세훈', '김동연', '한동훈')").then(r => {
  console.log('Deleted fake pols:', r.rowCount);
  pool.end();
});
