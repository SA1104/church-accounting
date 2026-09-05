const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({connectionString: process.env.DATABASE_URL});
pool.query(`SELECT category, COUNT(*) as count FROM insight_candidates GROUP BY category`).then(res => {
    console.log(res.rows);
    process.exit(0);
}).catch(console.error);
