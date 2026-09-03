require('dotenv').config({ path: 'backend/.env.development' });
const { Client } = require('pg');
const fs = require('fs');

async function generateV3Payload() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const insts = await client.query('SELECT * FROM stock_instruments ORDER BY stock_code');
  const venues = await client.query(`
    SELECT v.*, i.stock_code, i.primary_market_code 
    FROM stock_instrument_venues v 
    JOIN stock_instruments i ON v.instrument_id = i.id 
    ORDER BY i.stock_code
  `);

  let sql = 'BEGIN;\n\n';

  // stock_instruments
  for (const row of insts.rows) {
    const esc = (str) => str ? "'" + str.replace(/'/g, "''") + "'" : 'NULL';
    const active = row.is_active ? 'TRUE' : 'FALSE';
    
    sql += `INSERT INTO public.stock_instruments ` +
      `(stock_code, isin_code, corp_code, instrument_name, instrument_name_en, primary_market_code, security_type, sector_code, industry_code, listing_date, delisting_date, listing_status, currency_code, is_active, source_id, source_updated_at) ` +
      `VALUES (${esc(row.stock_code)}, ${esc(row.isin_code)}, ${esc(row.corp_code)}, ${esc(row.instrument_name)}, ${esc(row.instrument_name_en)}, ${esc(row.primary_market_code)}, ${esc(row.security_type)}, ${esc(row.sector_code)}, ${esc(row.industry_code)}, ${esc(row.listing_date ? row.listing_date.toISOString().split('T')[0] : null)}, ${esc(row.delisting_date)}, ${esc(row.listing_status)}, ${esc(row.currency_code)}, ${active}, (SELECT id FROM public.stock_data_sources WHERE source_code = 'KRX_OPEN_API'), NULL) ` +
      `ON CONFLICT (stock_code, primary_market_code) DO UPDATE SET ` +
      `instrument_name = EXCLUDED.instrument_name, instrument_name_en = EXCLUDED.instrument_name_en, ` +
      `isin_code = EXCLUDED.isin_code, corp_code = EXCLUDED.corp_code, ` +
      `security_type = EXCLUDED.security_type, sector_code = EXCLUDED.sector_code, ` +
      `industry_code = EXCLUDED.industry_code, listing_date = EXCLUDED.listing_date, ` +
      `listing_status = EXCLUDED.listing_status, is_active = EXCLUDED.is_active, ` +
      `source_id = EXCLUDED.source_id, source_updated_at = EXCLUDED.source_updated_at;\n`;
  }

  sql += '\n';

  // stock_instrument_venues
  for (const row of venues.rows) {
    const esc = (str) => str ? "'" + str.replace(/'/g, "''") + "'" : 'NULL';
    const eligible = row.is_trade_eligible ? 'TRUE' : 'FALSE';
    
    sql += `INSERT INTO public.stock_instrument_venues ` +
      `(instrument_id, venue_code, venue_symbol, is_trade_eligible, eligible_from, eligible_to, source_id) ` +
      `VALUES (` +
      `(SELECT id FROM public.stock_instruments WHERE stock_code = ${esc(row.stock_code)} AND primary_market_code = ${esc(row.primary_market_code)}), ` +
      `${esc(row.venue_code)}, ${esc(row.venue_symbol)}, ${eligible}, ${esc(row.eligible_from)}, ${esc(row.eligible_to)}, ` +
      `(SELECT id FROM public.stock_data_sources WHERE source_code = 'KRX_OPEN_API')) ` +
      `ON CONFLICT (instrument_id, venue_code) DO NOTHING;\n`;
  }

  sql += '\nCOMMIT;\n';

  fs.writeFileSync('database/verification/production_stock_instruments_payload_v3.sql', sql);
  console.log('Payload V3 created successfully.');
  console.log(`Instruments: ${insts.rows.length}, Venues: ${venues.rows.length}`);

  await client.end();
}

generateV3Payload().catch(e => { console.error(e); process.exit(1); });
