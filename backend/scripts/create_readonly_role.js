const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  const password = process.env.STAGING_READONLY_PASSWORD || 'default_secure_pass';
  
  try {
    await client.query('BEGIN');
    
    // Check if role exists
    const res = await client.query(`SELECT 1 FROM pg_roles WHERE rolname = 'staging_readonly'`);
    if (res.rowCount === 0) {
      await client.query(`CREATE ROLE staging_readonly WITH LOGIN PASSWORD '${password}' CONNECTION LIMIT 50`);
      console.log('Created staging_readonly role');
    } else {
      await client.query(`ALTER ROLE staging_readonly WITH LOGIN PASSWORD '${password}' CONNECTION LIMIT 50`);
      console.log('Updated staging_readonly role');
    }

    await client.query(`ALTER ROLE staging_readonly SET default_transaction_read_only = on`);
    
    // Grant permissions
    await client.query(`GRANT CONNECT ON DATABASE postgres TO staging_readonly`);
    await client.query(`GRANT USAGE ON SCHEMA public TO staging_readonly`);
    
    const tables = [
      'stock_instruments', 'stock_daily_bars', 'stock_session_snapshots', 
      'stock_indices', 'stock_index_daily_bars', 'stock_markets', 
      'stock_instrument_venues', 'stock_daily_briefs'
    ];
    
    for (const table of tables) {
      await client.query(`GRANT SELECT ON TABLE public.${table} TO staging_readonly`);
    }

    // Explicitly revoke write permissions just in case
    await client.query(`REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM staging_readonly`);
    
    await client.query('COMMIT');
    console.log('Role configuration completed successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error creating role:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

run();
