const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    // Check pg_stat_activity for uncommitted transactions related to DELETE
    const activityQuery = `
      SELECT pid, state, state_change, query_start, query, application_name, client_addr
      FROM pg_stat_activity
      WHERE state = 'idle in transaction' OR query ILIKE '%DELETE%stock_daily_bars%';
    `;
    const activity = await p.query(activityQuery);
    console.log("=== pg_stat_activity ===");
    console.table(activity.rows);

    // Check physical stats
    const statsQuery = `
      SELECT 
        relname,
        n_live_tup,
        n_dead_tup,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze,
        pg_size_pretty(pg_relation_size(relid)) AS table_size,
        pg_size_pretty(pg_indexes_size(relid)) AS index_size
      FROM pg_stat_user_tables
      WHERE relname LIKE 'stock_%'
      ORDER BY n_live_tup DESC;
    `;
    const stats = await p.query(statsQuery);
    console.log("\\n=== pg_stat_user_tables ===");
    console.table(stats.rows);

    // Check pg_stat_progress_vacuum
    const vacuumQuery = `
      SELECT * FROM pg_stat_progress_vacuum;
    `;
    const vacuum = await p.query(vacuumQuery);
    console.log("\\n=== pg_stat_progress_vacuum ===");
    console.table(vacuum.rows);

  } catch (e) {
    console.error(e);
  } finally {
    p.end();
  }
}
check();
