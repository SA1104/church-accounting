const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query("SELECT * FROM stock_ingestion_runs ORDER BY started_at ASC")
.then(r => { console.table(r.rows); p.end(); }).catch(e => { console.log(e); p.end(); });
