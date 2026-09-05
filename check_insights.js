const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({connectionString: process.env.DATABASE_URL});
pool.query(`SELECT id, category, title, created_at FROM public.market_insights ORDER BY created_at DESC LIMIT 10`).then(res => {
    console.log(res.rows);
    process.exit(0);
}).catch(console.error);
