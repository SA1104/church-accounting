const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  
  console.log('\\n--- 2. DB 실제 용량 확인 ---');
  const dbSize = await client.query(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`);
  console.log('현재 DB 총 크기:', dbSize.rows[0].size);
  
  const tables = await client.query(`
    SELECT
      relname,
      pg_size_pretty(pg_relation_size(relid)) AS table_size,
      pg_size_pretty(pg_indexes_size(relid)) AS index_size,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size
    FROM pg_catalog.pg_statio_user_tables
    WHERE relname LIKE 'stock_%'
    ORDER BY pg_total_relation_size(relid) DESC
  `);
  console.log('테이블별 용량:');
  tables.rows.forEach(r => {
    console.log(`  ${r.relname}: Table ${r.table_size}, Index ${r.index_size}, Total ${r.total_size}`);
  });
  
  client.release();
  pool.end();
}
run().catch(console.error);
