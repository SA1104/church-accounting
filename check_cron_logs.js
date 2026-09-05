const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({connectionString: process.env.DATABASE_URL});
pool.query(`SELECT job_name, status, message, created_at FROM system_cron_logs ORDER BY created_at DESC LIMIT 20`).then(res => {
    console.table(res.rows);
    process.exit(0);
}).catch(console.error);
