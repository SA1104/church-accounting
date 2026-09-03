const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    console.log("=== Constraints ===");
    const res = await p.query(`
      SELECT 
        tc.constraint_name, tc.constraint_type, kcu.column_name 
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'stock_daily_bars'
    `);
    console.table(res.rows);

    console.log("=== PUBLIC Grants on 9 tables ===");
    const pub = await p.query(`
      SELECT table_name, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE grantee = 'PUBLIC' AND table_schema = 'public' 
      AND table_name IN ('stock_instruments', 'stock_instrument_venues', 'stock_daily_bars', 'stock_index_daily_bars', 'stock_ingestion_runs', 'stock_data_sources', 'stock_indices', 'stock_markets', 'stock_session_snapshots')
    `);
    console.table(pub.rows);

    console.log("=== PUBLIC Schema Create ===");
    const sch = await p.query(`
      SELECT has_schema_privilege('public', 'public', 'CREATE') as pub_create,
             has_schema_privilege('public', 'public', 'USAGE') as pub_usage
    `);
    console.table(sch.rows);

    console.log("=== PUBLIC/Inherit Policies ===");
    const pol = await p.query(`
      SELECT tablename, policyname, roles::text
      FROM pg_policies
      WHERE roles::text LIKE '%PUBLIC%' OR roles::text = '{anon,authenticated}'
    `);
    console.table(pol.rows);
  } finally {
    p.end();
  }
}
run();
