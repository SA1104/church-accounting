const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    console.log("=== pg_roles ===");
    const roles = await p.query("SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls FROM pg_roles WHERE rolname IN ('stock_ingestion_writer', 'stock_app_readonly')");
    console.table(roles.rows);

    console.log("\\n=== role_table_grants ===");
    const grants = await p.query("SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants WHERE grantee IN ('stock_ingestion_writer', 'stock_app_readonly') AND table_schema = 'public' ORDER BY table_name, privilege_type");
    console.table(grants.rows);

    const rls = await p.query("SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('stock_daily_bars', 'stock_instruments', 'stock_index_daily_bars', 'stock_ingestion_runs', 'stock_instrument_venues', 'stock_data_sources')");
    console.table(rls.rows);
    
    console.log("\\n=== pg_policies for all stock tables ===");
    const policies = await p.query("SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'stock_%'");
    console.table(policies.rows);

  } catch(e) {
    console.error(e);
  } finally {
    p.end();
  }
}
check();
