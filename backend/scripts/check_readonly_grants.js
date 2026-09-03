const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query("SELECT table_name, privilege_type FROM information_schema.role_table_grants WHERE grantee='stock_app_readonly'")
.then(r => { console.log(r.rows); p.end(); }).catch(e => { console.log(e); p.end(); });
