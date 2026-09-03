require('dotenv').config({ path: 'backend/.env.development' });
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const counts = await client.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN primary_market_code = 'KRX_KOSPI' THEN 1 ELSE 0 END) as kospi,
      SUM(CASE WHEN primary_market_code = 'KRX_KOSDAQ' THEN 1 ELSE 0 END) as kosdaq,
      SUM(CASE WHEN listing_date IS NOT NULL THEN 1 ELSE 0 END) as has_listing_date
    FROM public.stock_instruments;
  `);

  const venues = await client.query(`SELECT COUNT(*) as total FROM public.stock_instrument_venues;`);

  const s5930 = await client.query(`SELECT * FROM public.stock_instruments WHERE stock_code IN ('005930', '005935') ORDER BY stock_code;`);

  console.log('INSTRUMENTS:', counts.rows[0]);
  console.log('VENUES:', venues.rows[0]);
  console.log('SAMSUNG:', s5930.rows);

  await client.end();
}

run().catch(console.error);
