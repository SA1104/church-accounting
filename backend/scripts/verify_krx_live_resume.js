const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const { KrxOpenApiProvider } = require('../service/stock/providers/KrxOpenApiProvider');
const IngestionService = require('../service/stock/services/IngestionService');
const StockRepository = require('../service/stock/repositories/StockRepository');
const { Pool } = require('pg');

async function run() {
  const apiKey = process.env.KRX_OPEN_API_AUTH_KEY || process.env.KRX_API_KEY;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const repo = new StockRepository(pool);
  
  async function getCounts() {
      const q1 = await pool.query('SELECT count(*) FROM stock_instruments');
      const q2 = await pool.query('SELECT count(*) FROM stock_instrument_venues');
      const q3 = await pool.query('SELECT count(*) FROM stock_ingestion_runs');
      const q4 = await pool.query('SELECT count(*) FROM stock_ingestion_errors');
      return {
          instruments: parseInt(q1.rows[0].count),
          venues: parseInt(q2.rows[0].count),
          runs: parseInt(q3.rows[0].count),
          errors: parseInt(q4.rows[0].count)
      };
  }
  const countsBefore = await getCounts();
  console.log('COUNTS_BEFORE:', JSON.stringify(countsBefore));

  const krx = new KrxOpenApiProvider({ apiKey });
  const ingestionService = new IngestionService(krx, repo);

  let kospiData = null;
  let kosdaqData = null;
  let networkCalls = 0;

  async function fetchLive(endpoint) {
    networkCalls++;
    const start = Date.now();
    const url = new URL('https://data-dbg.krx.co.kr/svc/apis/sto/' + endpoint);
    url.searchParams.set('basDd', '20230102'); // Sandbox test date
    const response = await fetch(url.toString(), { headers: { 'AUTH_KEY': krx.apiKey } });
    const durationMs = Date.now() - start;
    
    console.log('\n--- LIVE API:', endpoint, '---');
    console.log('HTTP Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('Duration Ms:', durationMs);
    
    if (!response.ok) return null;
    const data = await response.json();
    const topKeys = Object.keys(data);
    console.log('Top Keys:', topKeys.join(', '));
    const arrayKey = topKeys.find(k => Array.isArray(data[k]));
    console.log('Array Key:', arrayKey);
    const records = data[arrayKey] || [];
    console.log('Return Count:', records.length);
    
    if (records.length > 0) {
      console.log('Actual Fields:', Object.keys(records[0]).join(', '));
      const r = records[0];
      const sanitized = {};
      for (const k in r) {
        if (typeof r[k] === 'string' && r[k].length > 0 && k !== 'ISU_SRT_CD' && k !== 'ISU_CD' && k !== 'MKT_ID') {
          sanitized[k] = '***';
        } else {
          sanitized[k] = r[k];
        }
      }
      console.log('Sample Record:', JSON.stringify(sanitized));
    }
    return { data, durationMs, records };
  }

  kospiData = await fetchLive('stk_isu_base_info');
  kosdaqData = await fetchLive('ksq_isu_base_info');

  console.log('\n--- DRY RUN SUMMARY ---');
  let repoWrites = 0;
  const origUpsert = repo.upsertInstruments.bind(repo);
  repo.upsertInstruments = async (records, options) => {
      if (!options.dryRun) repoWrites++;
      return await origUpsert(records, options);
  };

  krx.fetchInstruments = async (params) => {
      const market = params.market || 'KOSPI';
      const d = market === 'KOSDAQ' ? kosdaqData.records : kospiData.records;
      const meta = { asOfAt: new Date().toISOString(), apiId: market };
      return krx.normalizeInstrumentResponse(d, meta, market);
  };

  const res1 = await ingestionService.runInstrumentIngestion({ dryRun: true, fixture: false, market: 'KOSPI' });
  const res2 = await ingestionService.runInstrumentIngestion({ dryRun: true, fixture: false, market: 'KOSDAQ' });

  console.log('NETWORK_CALLS:', networkCalls);
  console.log('KOSPI_FETCHED:', res1.fetchedCount);
  console.log('KOSDAQ_FETCHED:', res2.fetchedCount);
  console.log('TOTAL_FETCHED:', res1.fetchedCount + res2.fetchedCount);
  console.log('NORMALIZED:', res1.normalizedCount + res2.normalizedCount);
  console.log('ACCEPTED:', res1.acceptedCount + res2.acceptedCount);
  console.log('REJECTED:', res1.rejectedCount + res2.rejectedCount);
  console.log('DUPLICATE:', res1.duplicateCount + res2.duplicateCount);
  console.log('WOULD_INSERT:', res1.wouldInsertCount + res2.wouldInsertCount);
  console.log('WOULD_UPDATE:', res1.wouldUpdateCount + res2.wouldUpdateCount);
  console.log('REPO_WRITES:', repoWrites);

  const countsAfter = await getCounts();
  console.log('COUNTS_AFTER:', JSON.stringify(countsAfter));
  await pool.end();
}
run();
