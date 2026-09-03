const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query("SELECT relname, relrowsecurity FROM pg_class WHERE relname='stock_daily_bars'")
.then(r => { console.log(r.rows); p.end(); }).catch(e => { console.log(e); p.end(); });
