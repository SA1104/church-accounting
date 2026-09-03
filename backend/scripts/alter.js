const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(async () => {
  await c.query("ALTER TABLE stock_daily_bars ALTER COLUMN change_rate TYPE numeric(15,4)");
  await c.query("ALTER TABLE stock_index_daily_bars ALTER COLUMN change_rate TYPE numeric(15,4)");
  console.log('Altered columns');
  process.exit(0);
});
