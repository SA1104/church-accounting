require('dotenv').config({ path: 'backend/.env.development' });
const { Client } = require('pg');
const { KrxOpenApiProvider } = require('./backend/service/stock/providers/KrxOpenApiProvider');
const StockRepository = require('./backend/service/stock/repositories/StockRepository');
const fs = require('fs');

async function runLiveSync() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const repo = new StockRepository(client);
  const provider = new KrxOpenApiProvider();

  console.log('--- STARTING LIVE DEV SYNC ---');

  const kospiData = await provider.fetchInstruments({ market: 'KOSPI', date: '20260814' });
  console.log(`KOSPI Fetched: ${kospiData.records.length}`);
  
  const kosdaqData = await provider.fetchInstruments({ market: 'KOSDAQ', date: '20260814' });
  console.log(`KOSDAQ Fetched: ${kosdaqData.records.length}`);

  if (kospiData.records.length === 0 || kosdaqData.records.length === 0) {
    throw new Error('API returned 0 records for one or both markets.');
  }

  const fetchedRecords = [...kospiData.records, ...kosdaqData.records];
  const fetchedMap = new Map();
  for (const r of fetchedRecords) {
    fetchedMap.set(r.stock_code, r);
  }

  const listingDatesMap = JSON.parse(fs.readFileSync('listing_dates.json', 'utf8'));

  await client.query('BEGIN');
  
  const existing = await client.query('SELECT * FROM stock_instruments');
  const recordsToUpsert = [];

  for (const row of existing.rows) {
    const fetched = fetchedMap.get(row.stock_code);
    
    let listingDate = row.listing_date;
    if (fetched && fetched.listing_date) {
      listingDate = fetched.listing_date;
    } else if (listingDatesMap[row.stock_code]) {
      listingDate = listingDatesMap[row.stock_code];
    }

    recordsToUpsert.push({
      stock_code: row.stock_code,
      instrument_name: fetched ? fetched.instrument_name : row.instrument_name,
      instrument_name_en: fetched ? fetched.instrument_name_en : row.instrument_name_en,
      primary_market_code: row.primary_market_code,
      security_type: row.security_type,
      listing_date: listingDate,
      currency_code: row.currency_code,
      is_active: fetched ? fetched.is_active : row.is_active,
    });
  }

  console.log(`Upserting ${recordsToUpsert.length} existing instruments...`);
  await repo.upsertInstruments(recordsToUpsert);

  const counts = await client.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN primary_market_code = 'KRX_KOSPI' THEN 1 ELSE 0 END) as kospi,
      SUM(CASE WHEN primary_market_code = 'KRX_KOSDAQ' THEN 1 ELSE 0 END) as kosdaq,
      SUM(CASE WHEN listing_date IS NOT NULL THEN 1 ELSE 0 END) as has_listing_date
    FROM public.stock_instruments;
  `);

  const venues = await client.query(`SELECT COUNT(*) as total FROM public.stock_instrument_venues;`);
  const insts = await client.query(`SELECT * FROM stock_instruments WHERE stock_code IN ('005930', '005935') ORDER BY stock_code;`);

  console.log('INSTRUMENTS:', counts.rows[0]);
  console.log('VENUES:', venues.rows[0]);
  
  const total = parseInt(counts.rows[0].total);
  const kospi = parseInt(counts.rows[0].kospi);
  const kosdaq = parseInt(counts.rows[0].kosdaq);
  const hasListingDate = parseInt(counts.rows[0].has_listing_date);
  const totalVenues = parseInt(venues.rows[0].total);

  let ok = true;
  if (total !== 2558) { console.error('Total must be 2558'); ok = false; }
  if (kospi !== 943) { console.error('KOSPI must be 943'); ok = false; }
  if (kosdaq !== 1615) { console.error('KOSDAQ must be 1615'); ok = false; }
  if (hasListingDate !== 2558) { console.error('listing_date must be populated for 2558'); ok = false; }
  if (totalVenues !== 2558) { console.error('Venues must be exactly 2558'); ok = false; }

  const s5930 = insts.rows.find(r => r.stock_code === '005930');
  const s5935 = insts.rows.find(r => r.stock_code === '005935');

  if (s5930.security_type !== 'COMMON') { console.error('Samsung must be COMMON'); ok = false; }
  if (s5935.security_type !== 'PREFERRED') { console.error('SamsungPref must be PREFERRED'); ok = false; }

  if (!ok) {
    console.log('ASSERTIONS FAILED, ROLLBACK');
    await client.query('ROLLBACK');
    await client.end();
    process.exit(1);
  }

  // Double check duplicates
  const codeDups = await client.query(`SELECT stock_code FROM stock_instruments GROUP BY stock_code HAVING COUNT(*) > 1`);
  if (codeDups.rows.length > 0) {
     console.error('stock_code duplicates found');
     await client.query('ROLLBACK');
     await client.end();
     process.exit(1);
  }

  const nullCodes = await client.query(`SELECT id FROM stock_instruments WHERE stock_code IS NULL OR instrument_name IS NULL`);
  if (nullCodes.rows.length > 0) {
     console.error('NULL codes found');
     await client.query('ROLLBACK');
     await client.end();
     process.exit(1);
  }

  const venueDups = await client.query(`SELECT instrument_id FROM stock_instrument_venues GROUP BY instrument_id HAVING COUNT(*) > 1`);
  if (venueDups.rows.length > 0) {
     console.error('Venue duplicates per instrument found');
     await client.query('ROLLBACK');
     await client.end();
     process.exit(1);
  }

  await client.query('COMMIT');
  console.log('--- LIVE DEV SYNC COMMIT OK ---');
  await client.end();
}

runLiveSync().catch(e => { console.error(e); process.exit(1); });
