const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(async () => {
  await c.query('DELETE FROM stock_ingestion_runs WHERE id = $1', ['BACKFILL_2026-08-14']);
  console.log('Deleted');
  process.exit(0);
});
