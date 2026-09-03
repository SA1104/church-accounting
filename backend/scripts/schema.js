const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(async () => {
  const r = await c.query("SELECT column_name, data_type, numeric_precision, numeric_scale FROM information_schema.columns WHERE table_name = 'stock_index_daily_bars'");
  console.table(r.rows);
  process.exit(0);
});
