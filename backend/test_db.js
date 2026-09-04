const { Pool } = require('pg');
const pool = new Pool({connectionString: 'postgresql://postgres.zuclqyxfovktmhfzzuji:NEU4F8R6y3tXyQY8@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'});
pool.query("SELECT dynamic_metrics FROM politics_annual_stats LIMIT 3").then(res => console.log(res.rows)).finally(()=>pool.end());
