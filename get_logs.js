const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({connectionString: process.env.DATABASE_URL});
pool.query(`SELECT message FROM system_cron_logs WHERE job_name = 'generate_hitl_insight' ORDER BY created_at DESC LIMIT 5`).then(res => {
    console.log(res.rows);
    process.exit(0);
});
