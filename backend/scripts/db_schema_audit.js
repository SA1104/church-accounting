const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function audit() {
  const client = await pool.connect();
  
  // 1. DB identity
  const db = await client.query(`SELECT current_database() as db`);
  console.log('current_database:', db.rows[0].db);
  
  // 2. Project ref fingerprint (masked)
  const hostMatch = process.env.DATABASE_URL.match(/@([^:]+):/);
  const host = hostMatch ? hostMatch[1] : 'unknown';
  const hash = crypto.createHash('sha256').update(host).digest('hex').substring(0, 12);
  console.log('DB Host SHA256 prefix:', hash);
  console.log('DB Host masked:', host.substring(0, 8) + '...' + host.substring(host.length - 8));
  
  // 3. All stock tables and their columns
  const tables = await client.query(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'stock_%'
    ORDER BY table_name, ordinal_position
  `);
  
  let currentTable = '';
  for (const row of tables.rows) {
    if (row.table_name !== currentTable) {
      currentTable = row.table_name;
      console.log(`\n=== TABLE: ${currentTable} ===`);
    }
    console.log(`  ${row.column_name} | ${row.data_type} | nullable=${row.is_nullable} | default=${row.column_default}`);
  }
  
  // 4. Constraints and indexes
  const constraints = await client.query(`
    SELECT tc.table_name, tc.constraint_name, tc.constraint_type, 
           kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
    AND tc.table_name LIKE 'stock_%'
    ORDER BY tc.table_name, tc.constraint_name
  `);
  console.log('\n=== CONSTRAINTS ===');
  for (const row of constraints.rows) {
    console.log(`${row.table_name} | ${row.constraint_name} | ${row.constraint_type} | ${row.column_name}`);
  }
  
  // 5. Indexes
  const indexes = await client.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename LIKE 'stock_%'
    ORDER BY tablename, indexname
  `);
  console.log('\n=== INDEXES ===');
  for (const row of indexes.rows) {
    console.log(`${row.tablename} | ${row.indexname} | ${row.indexdef}`);
  }
  
  // 6. Row counts for all stock tables
  const stockTables = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE 'stock_%'
    ORDER BY table_name
  `);
  console.log('\n=== ROW COUNTS ===');
  for (const t of stockTables.rows) {
    const count = await client.query(`SELECT COUNT(*) as c FROM public.${t.table_name}`);
    console.log(`${t.table_name}: ${count.rows[0].c}`);
  }
  
  // 7. Instrument breakdown
  console.log('\n=== INSTRUMENTS ===');
  const instByType = await client.query(`SELECT security_type, is_active, listing_status, COUNT(*) as c FROM stock_instruments GROUP BY security_type, is_active, listing_status ORDER BY security_type`);
  for (const row of instByType.rows) {
    console.log(`type=${row.security_type} active=${row.is_active} status=${row.listing_status} count=${row.c}`);
  }
  
  // 8. Check stock_ingestion_runs for any SUCCESS entries
  const runs = await client.query(`SELECT status, COUNT(*) as c FROM stock_ingestion_runs GROUP BY status`);
  console.log('\n=== INGESTION RUNS ===');
  for (const row of runs.rows) {
    console.log(`status=${row.status} count=${row.c}`);
  }
  
  // 9. DB size
  const dbSize = await client.query(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`);
  console.log('\nDB Size:', dbSize.rows[0].size);
  
  // 10. Environment variables
  console.log('\n=== ENV VARS ===');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'UNDEFINED');
  console.log('STOCK_WRITE_TARGET:', process.env.STOCK_WRITE_TARGET || 'UNDEFINED');
  console.log('DEV_DATABASE_PROJECT_REF:', process.env.DEV_DATABASE_PROJECT_REF || 'UNDEFINED');
  console.log('KRX_OPEN_API_AUTH_KEY present:', !!process.env.KRX_OPEN_API_AUTH_KEY);
  console.log('KRX_API_KEY present:', !!process.env.KRX_API_KEY);
  
  client.release();
  pool.end();
}

audit().catch(e => { console.error('AUDIT FAILED:', e.message); pool.end(); });
