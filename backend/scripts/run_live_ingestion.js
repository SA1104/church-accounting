const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const { Pool } = require('pg');
const { KrxOpenApiProvider } = require('../service/stock/providers/KrxOpenApiProvider');
const IngestionService = require('../service/stock/services/IngestionService');
const StockRepository = require('../service/stock/repositories/StockRepository');

async function run() {
  process.env.ALLOW_STOCK_DATA_WRITE = 'YES_DEV_ONLY';
  if (process.env.NODE_ENV === 'production' || (!process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('aws-0-ap-northeast-1'))) {
     console.error('PROD DB DETECTED OR INVALID URL');
     process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  const countRes = await pool.query("SELECT (SELECT count(*) FROM stock_instruments) as instruments, (SELECT count(*) FROM stock_instrument_venues) as venues, (SELECT count(*) FROM information_schema.tables WHERE table_schema='public') as tables");
  
  console.log('PRE-CHECK:', JSON.stringify(countRes.rows[0]));
  if (parseInt(countRes.rows[0].instruments) !== 0 || parseInt(countRes.rows[0].venues) !== 0) {
     console.error('Tables are not empty!');
  }

  const client = await pool.connect();
  const repo = new StockRepository(client);
  const krx = new KrxOpenApiProvider({ apiKey: process.env.KRX_OPEN_API_AUTH_KEY || process.env.KRX_API_KEY });
  const ingestion = new IngestionService(krx, repo);

  try {
    await client.query('BEGIN');
    
    console.log('Preparing Reference Data...');
    await client.query("INSERT INTO stock_data_sources (source_code, source_name, source_type, access_type) VALUES ('KRX_OPEN_API', 'KRX Open API', 'PROVIDER', 'OPEN_API') ON CONFLICT DO NOTHING;");
    await client.query("INSERT INTO stock_markets (market_code, market_name, country_code, timezone, currency_code, market_type) VALUES ('KRX_KOSPI', 'KOSPI', 'KR', 'Asia/Seoul', 'KRW', 'EQUITY'), ('KRX_KOSDAQ', 'KOSDAQ', 'KR', 'Asia/Seoul', 'KRW', 'EQUITY') ON CONFLICT DO NOTHING;");

    krx.httpClient = async (endpoint, params) => {
        const url = new URL('https://data-dbg.krx.co.kr/svc/apis/sto/' + endpoint);
        url.searchParams.set('basDd', '20230102');
        const res = await fetch(url.toString(), { headers: { 'AUTH_KEY': krx.apiKey.replace(/"/g, '') } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
    };

    console.log('Running Ingestion (KOSPI)...');
    const res1 = await ingestion.runInstrumentIngestion({ dryRun: false, fixture: false, market: 'KOSPI' });
    console.log('KOSPI:', res1.acceptedCount, 'accepted');
    
    console.log('Running Ingestion (KOSDAQ)...');
    const res2 = await ingestion.runInstrumentIngestion({ dryRun: false, fixture: false, market: 'KOSDAQ' });
    console.log('KOSDAQ:', res2.acceptedCount, 'accepted');

    console.log('Committing transaction...');
    await client.query('COMMIT');
    console.log('Ingestion Complete.');

  } catch(e) {
    console.error('ERROR during ingestion:', e);
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }

  const postRes = await pool.query("SELECT count(*) as total, sum(case when primary_market_code='KRX_KOSPI' then 1 else 0 end) as kospi, sum(case when primary_market_code='KRX_KOSDAQ' then 1 else 0 end) as kosdaq, sum(case when stock_code IS NULL then 1 else 0 end) as nulls, sum(case when is_active=true then 1 else 0 end) as active, sum(case when currency_code='KRW' then 1 else 0 end) as krw, sum(case when stock_code='005930' then 1 else 0 end) as samsung FROM stock_instruments");
  console.log('POST-CHECK:', JSON.stringify(postRes.rows[0]));

  await pool.end();
}

run();
