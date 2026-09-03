const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(async () => {
  await c.query("DELETE FROM stock_daily_bars WHERE trade_date < '2026-01-01'");
  await c.query("DELETE FROM stock_ingestion_runs WHERE target_date < '2026-01-01'");
  await c.query("DELETE FROM stock_unmatched_history_summary");
  console.log('Cleaned old data');
  process.exit(0);
});
