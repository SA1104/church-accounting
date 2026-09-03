const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query("SELECT polname, polcmd, polroles FROM pg_policy WHERE polrelid = 'stock_daily_bars'::regclass")
.then(r => { console.log(r.rows); p.end(); }).catch(e => { console.log(e); p.end(); });
