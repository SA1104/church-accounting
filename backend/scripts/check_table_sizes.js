const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const p = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
  try {
    let r = await p.query(`
SELECT
    relname,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS index_size,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    n_live_tup
FROM pg_catalog.pg_stat_user_tables
WHERE relname LIKE 'stock_%'
ORDER BY pg_total_relation_size(relid) DESC;
`);
    console.table(r.rows);
  } catch (e) {
    console.error(e);
  } finally {
    p.end();
  }
}
check();
