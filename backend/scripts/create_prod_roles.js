const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  const readerPass = process.env.APP_READONLY_PASSWORD || 'reader_pass';
  const writerPass = process.env.APP_WRITER_PASSWORD || 'writer_pass';
  
  try {
    await client.query('BEGIN');
    
    const roles = ['stock_app_readonly', 'stock_ingestion_writer'];
    for (const r of roles) {
      const exists = await client.query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [r]);
      const pass = r === 'stock_app_readonly' ? readerPass : writerPass;
      if (exists.rowCount === 0) {
        await client.query(`CREATE ROLE ${r} WITH LOGIN PASSWORD '${pass}' CONNECTION LIMIT 50`);
        console.log(`Created ${r}`);
      } else {
        await client.query(`ALTER ROLE ${r} WITH LOGIN PASSWORD '${pass}' CONNECTION LIMIT 50`);
        console.log(`Updated ${r}`);
      }
    }

    // stock_app_readonly (SELECT only)
    await client.query(`ALTER ROLE stock_app_readonly SET default_transaction_read_only = on`);
    await client.query(`GRANT CONNECT ON DATABASE postgres TO stock_app_readonly`);
    await client.query(`GRANT USAGE ON SCHEMA public TO stock_app_readonly`);
    
    // stock_ingestion_writer (INSERT/UPDATE/SELECT)
    await client.query(`ALTER ROLE stock_ingestion_writer SET default_transaction_read_only = off`);
    await client.query(`GRANT CONNECT ON DATABASE postgres TO stock_ingestion_writer`);
    await client.query(`GRANT USAGE ON SCHEMA public TO stock_ingestion_writer`);

    const tables = [
      'stock_instruments', 'stock_daily_bars', 'stock_session_snapshots', 
      'stock_indices', 'stock_index_daily_bars', 'stock_markets', 
      'stock_instrument_venues', 'stock_daily_briefs', 'stock_ingestion_runs', 'stock_data_sources'
    ];
    
    for (const table of tables) {
      await client.query(`GRANT SELECT ON TABLE public.${table} TO stock_app_readonly`);
      await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.${table} TO stock_ingestion_writer`);
    }

    await client.query(`REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM stock_app_readonly`);
    
    await client.query('COMMIT');
    console.log('Roles created successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

run();
