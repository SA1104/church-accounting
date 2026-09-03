require('dotenv').config({ path: 'backend/.env.development' });
const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const sources = await client.query('SELECT * FROM stock_data_sources');
  const markets = await client.query('SELECT * FROM stock_markets');
  const instruments = await client.query(`
    SELECT i.*, 
           s.source_code as ref_source_code,
           m.market_code as ref_market_code
    FROM stock_instruments i
    LEFT JOIN stock_data_sources s ON i.source_id = s.id
    LEFT JOIN stock_markets m ON i.primary_market_code = m.market_code
  `);
  const venues = await client.query(`
    SELECT v.*, 
           i.stock_code as ref_stock_code,
           i.primary_market_code as ref_stock_market_code,
           s.source_code as ref_source_code
    FROM stock_instrument_venues v
    JOIN stock_instruments i ON v.instrument_id = i.id
    LEFT JOIN stock_data_sources s ON v.source_id = s.id
  `);

  console.log('SOURCES:', sources.rows);
  console.log('MARKETS:', markets.rows);
  console.log('INSTRUMENTS:', instruments.rows.length);
  console.log('VENUES:', venues.rows.length);

  const kospi = instruments.rows.filter(i => i.primary_market_code === 'KRX_KOSPI').length;
  const kosdaq = instruments.rows.filter(i => i.primary_market_code === 'KRX_KOSDAQ').length;
  const nullOrEmptyCodes = instruments.rows.filter(i => !i.stock_code || i.stock_code.trim() === '').length;
  const nullOrEmptyNames = instruments.rows.filter(i => !i.instrument_name || i.instrument_name.trim() === '').length;
  const codeSet = new Set();
  let duplicates = 0;
  instruments.rows.forEach(i => {
    const key = `${i.stock_code}_${i.primary_market_code}`;
    if (codeSet.has(key)) duplicates++;
    codeSet.add(key);
  });

  const samsung = instruments.rows.find(i => i.stock_code === '005930');
  const samsungPref = instruments.rows.find(i => i.stock_code === '005935');

  console.log(`KOSPI 943: ${kospi === 943 ? 'OK' : kospi}`);
  console.log(`KOSDAQ 1,615: ${kosdaq === 1615 ? 'OK' : kosdaq}`);
  console.log(`?„ì²´ 2,558: ${instruments.rows.length === 2558 ? 'OK' : instruments.rows.length}`);
  console.log(`ì¤‘ë³µ stock_code 0: ${duplicates === 0 ? 'OK' : duplicates}`);
  console.log(`NULL ?ëŠ” ë¹?stock_code 0: ${nullOrEmptyCodes === 0 ? 'OK' : nullOrEmptyCodes}`);
  console.log(`NULL ?ëŠ” ë¹?instrument_name 0: ${nullOrEmptyNames === 0 ? 'OK' : nullOrEmptyNames}`);
  console.log(`?¼ì„±?„ìž 005930 COMMON: ${samsung?.security_type === 'COMMON' ? 'OK' : samsung?.security_type}`);
  console.log(`?¼ì„±?„ìž??005935 PREFERRED: ${samsungPref?.security_type === 'PREFERRED' ? 'OK' : samsungPref?.security_type}`);

  if (kospi !== 943 || kosdaq !== 1615 || instruments.rows.length !== 2558 || duplicates > 0 || nullOrEmptyCodes > 0 || nullOrEmptyNames > 0) {
    console.error('Validation failed!');
    process.exit(1);
  }

  const escapeSql = (val) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (val instanceof Date) return `'${val.toISOString()}'::timestamptz`;
    return `'${val.replace(/'/g, "''")}'`;
  };

  let sql = 'BEGIN;\n\n';

  // Sources
  sql += '-- Sources\n';
  sources.rows.forEach(row => {
    sql += `INSERT INTO public.stock_data_sources (source_code, source_name, source_type, official_url, api_base_url, access_type, delay_minutes, requires_api_key, license_status, redistribution_status, priority, is_enabled) VALUES (${escapeSql(row.source_code)}, ${escapeSql(row.source_name)}, ${escapeSql(row.source_type)}, ${escapeSql(row.official_url)}, ${escapeSql(row.api_base_url)}, ${escapeSql(row.access_type)}, ${escapeSql(row.delay_minutes)}, ${escapeSql(row.requires_api_key)}, ${escapeSql(row.license_status)}, ${escapeSql(row.redistribution_status)}, ${escapeSql(row.priority)}, ${escapeSql(row.is_enabled)}) ON CONFLICT (source_code) DO NOTHING;\n`;
  });
  sql += '\n';

  // Markets
  sql += '-- Markets\n';
  markets.rows.forEach(row => {
    sql += `INSERT INTO public.stock_markets (market_code, market_name, country_code, timezone, currency_code, market_type, is_active) VALUES (${escapeSql(row.market_code)}, ${escapeSql(row.market_name)}, ${escapeSql(row.country_code)}, ${escapeSql(row.timezone)}, ${escapeSql(row.currency_code)}, ${escapeSql(row.market_type)}, ${escapeSql(row.is_active)}) ON CONFLICT (market_code) DO NOTHING;\n`;
  });
  sql += '\n';

  // Instruments
  sql += '-- Instruments\n';
  instruments.rows.forEach(row => {
    const sourceIdSql = row.ref_source_code ? `(SELECT id FROM public.stock_data_sources WHERE source_code = ${escapeSql(row.ref_source_code)})` : 'NULL';
    sql += `INSERT INTO public.stock_instruments (stock_code, isin_code, corp_code, instrument_name, instrument_name_en, primary_market_code, security_type, sector_code, industry_code, listing_date, delisting_date, listing_status, currency_code, is_active, source_id, source_updated_at) VALUES (${escapeSql(row.stock_code)}, ${escapeSql(row.isin_code)}, ${escapeSql(row.corp_code)}, ${escapeSql(row.instrument_name)}, ${escapeSql(row.instrument_name_en)}, ${escapeSql(row.primary_market_code)}, ${escapeSql(row.security_type)}, ${escapeSql(row.sector_code)}, ${escapeSql(row.industry_code)}, ${escapeSql(row.listing_date ? row.listing_date.toISOString().split('T')[0] : null)}, ${escapeSql(row.delisting_date ? row.delisting_date.toISOString().split('T')[0] : null)}, ${escapeSql(row.listing_status)}, ${escapeSql(row.currency_code)}, ${escapeSql(row.is_active)}, ${sourceIdSql}, ${escapeSql(row.source_updated_at)}) ON CONFLICT (stock_code, primary_market_code) DO UPDATE SET instrument_name = EXCLUDED.instrument_name, instrument_name_en = EXCLUDED.instrument_name_en, isin_code = EXCLUDED.isin_code, corp_code = EXCLUDED.corp_code, security_type = EXCLUDED.security_type, sector_code = EXCLUDED.sector_code, industry_code = EXCLUDED.industry_code, listing_status = EXCLUDED.listing_status, is_active = EXCLUDED.is_active, source_id = EXCLUDED.source_id, source_updated_at = EXCLUDED.source_updated_at;\n`;
  });
  sql += '\n';

  // Venues
  sql += '-- Venues\n';
  venues.rows.forEach(row => {
    const instIdSql = `(SELECT id FROM public.stock_instruments WHERE stock_code = ${escapeSql(row.ref_stock_code)} AND primary_market_code = ${escapeSql(row.ref_stock_market_code)})`;
    const sourceIdSql = row.ref_source_code ? `(SELECT id FROM public.stock_data_sources WHERE source_code = ${escapeSql(row.ref_source_code)})` : 'NULL';
    sql += `INSERT INTO public.stock_instrument_venues (instrument_id, venue_code, venue_symbol, is_trade_eligible, eligible_from, eligible_to, source_id) VALUES (${instIdSql}, ${escapeSql(row.venue_code)}, ${escapeSql(row.venue_symbol)}, ${escapeSql(row.is_trade_eligible)}, ${escapeSql(row.eligible_from ? row.eligible_from.toISOString().split('T')[0] : null)}, ${escapeSql(row.eligible_to ? row.eligible_to.toISOString().split('T')[0] : null)}, ${sourceIdSql}) ON CONFLICT (instrument_id, venue_code) DO UPDATE SET venue_symbol = EXCLUDED.venue_symbol, is_trade_eligible = EXCLUDED.is_trade_eligible, eligible_from = EXCLUDED.eligible_from, eligible_to = EXCLUDED.eligible_to, source_id = EXCLUDED.source_id;\n`;
  });
  sql += '\n';

  // Verification SELECT
  sql += '-- Verification\n';
  sql += 'SELECT primary_market_code, COUNT(*) FROM public.stock_instruments GROUP BY primary_market_code;\n';
  sql += 'SELECT COUNT(*) AS total_instruments FROM public.stock_instruments;\n';
  sql += 'SELECT stock_code, instrument_name, security_type FROM public.stock_instruments WHERE stock_code IN (\'005930\', \'005935\');\n';

  sql += '\nCOMMIT;\n';

  fs.writeFileSync('database/verification/production_stock_instruments_payload.sql', sql, 'utf8');
  console.log('Payload generated successfully!');

  await client.end();
}

run().catch(console.error);
