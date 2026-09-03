const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query("SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name='stock_instruments'")
.then(r => { console.log(r.rows); p.end(); })
.catch(e => { console.log(e); p.end(); });
