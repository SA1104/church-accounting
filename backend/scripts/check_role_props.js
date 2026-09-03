const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query(`
  SELECT r.rolname, r.rolsuper, r.rolinherit, r.rolcreaterole, r.rolcreatedb, r.rolcanlogin, r.rolbypassrls,
  ARRAY(SELECT b.rolname FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles b ON (m.roleid = b.oid) WHERE m.member = r.oid) as memberof
  FROM pg_catalog.pg_roles r WHERE r.rolname IN ('stock_app_readonly', 'stock_ingestion_writer')
`).then(r => { console.log(r.rows); p.end(); }).catch(e => { console.log(e); p.end(); });
