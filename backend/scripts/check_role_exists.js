const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query("SELECT current_database(), current_user, (SELECT count(*) FROM pg_roles WHERE rolname='stock_ingestion_writer') as role_count").then(r=>console.table(r.rows)).finally(()=>p.end());
