const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(async () => {
  const r = await c.query("SELECT target_date, status FROM stock_ingestion_runs WHERE job_code='HISTORICAL_BACKFILL' ORDER BY target_date DESC LIMIT 20");
  console.table(r.rows);
  process.exit(0);
});
