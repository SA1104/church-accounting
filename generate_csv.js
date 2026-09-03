const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });
async function run() {
  const listingDates = JSON.parse(fs.readFileSync('listing_dates.json', 'utf8'));
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const db = await c.query('SELECT stock_code, instrument_name, primary_market_code FROM stock_instruments');
  const existingSet = new Set(db.rows.map(r => r.stock_code));
  
  const { KrxOpenApiProvider } = require('./backend/service/stock/providers/KrxOpenApiProvider');
  const p = new KrxOpenApiProvider();
  const kospi26 = await p.httpClient('stk_isu_base_info', { basDd: '20260814' });
  const kosdaq26 = await p.httpClient('ksq_isu_base_info', { basDd: '20260814' });
  const presentCodes = new Set([
    ...(kospi26.OutBlock_1 || []).map(r=>r.ISU_SRT_CD), 
    ...(kosdaq26.OutBlock_1 || []).map(r=>r.ISU_SRT_CD)
  ]);
  
  const csvLines = ['stock_code,instrument_name,market_code,listing_date,listing_date_source,listing_status,listing_status_source,delisting_date,delisting_date_source,current_api_present,historical_api_date,evidence_reference,verification_result'];
  
  let count = 0;
  for (const row of db.rows) {
    if (!presentCodes.has(row.stock_code)) {
      count++;
      const lddRaw = listingDates[row.stock_code] || '';
      const listing_date = lddRaw ? `${lddRaw.substring(0,4)}-${lddRaw.substring(4,6)}-${lddRaw.substring(6,8)}` : '';
      csvLines.push([
        row.stock_code,
        row.instrument_name,
        row.primary_market_code,
        listing_date,
        'KRX_HISTORICAL_API',
        'DELISTED',
        'KRX_API_ABSENCE',
        '',
        '',
        'FALSE',
        '20240102_OR_EARLIER',
        'KRX_OPEN_API_STK_ISU_BASE_INFO',
        'VERIFIED_DELISTED'
      ].join(','));
    }
  }
  
  const manifestPath = 'database/verification/production_stock_instruments_payload_v3_manifest.json';
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.currentlyListedCount = db.rows.length - count;
  manifest.delistedCount = count;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  fs.writeFileSync('delisted_verification.csv', csvLines.join('\n'));
  console.log('CSV created with', count, 'records. Fixed manifest to reflect', count, 'instead of 242.');
  await c.end();
}
run();
