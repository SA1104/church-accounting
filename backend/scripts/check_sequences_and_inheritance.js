const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    console.log("=== Sequences ===");
    const seqs = await p.query(`
      SELECT table_name, column_name, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN (
          'stock_instruments',
          'stock_instrument_venues',
          'stock_daily_bars',
          'stock_index_daily_bars',
          'stock_ingestion_runs',
          'stock_data_sources',
          'stock_indices',
          'stock_markets',
          'stock_session_snapshots'
        )
        AND column_default LIKE 'nextval%'
    `);
    console.table(seqs.rows);

    console.log("\\n=== pg_auth_members ===");
    const members = await p.query(`
      SELECT r.rolname as role, r1.rolname as member_of
      FROM pg_auth_members m
      JOIN pg_roles r ON r.oid = m.member
      JOIN pg_roles r1 ON r1.oid = m.roleid
      WHERE r.rolname = 'stock_ingestion_writer'
    `);
    console.table(members.rows);

  } catch(e) {
    console.error(e);
  } finally {
    p.end();
  }
}
check();
