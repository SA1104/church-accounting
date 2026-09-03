const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(async () => {
  const cols = [
    'open_price', 'high_price', 'low_price', 'close_price', 'previous_close_price',
    'change_amount', 'change_rate', 'adjusted_close'
  ];
  for (const col of cols) {
    await c.query(`ALTER TABLE stock_daily_bars ALTER COLUMN ${col} TYPE numeric(30,4)`);
  }
  await c.query("ALTER TABLE stock_daily_bars ALTER COLUMN trading_value TYPE numeric(35,4)");
  await c.query("ALTER TABLE stock_daily_bars ALTER COLUMN market_cap TYPE numeric(35,4)");

  const idxCols = [
    'open_value', 'high_value', 'low_value', 'close_value', 'previous_close_value',
    'change_value', 'change_rate', 'change_amount'
  ];
  for (const col of idxCols) {
    await c.query(`ALTER TABLE stock_index_daily_bars ALTER COLUMN ${col} TYPE numeric(30,4)`);
  }

  console.log('Altered all numeric columns to extreme precision!');
  process.exit(0);
});
