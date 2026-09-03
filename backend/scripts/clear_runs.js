const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query("DELETE FROM stock_ingestion_runs")
.then(()=>console.log('Cleared'))
.catch(console.log)
.finally(()=>p.end());
