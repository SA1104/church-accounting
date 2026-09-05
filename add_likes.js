const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(`
  ALTER TABLE politics_comments 
  ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;
`).then(r => {
  console.log('Added likes/dislikes to politics_comments');
  pool.end();
}).catch(console.error);
