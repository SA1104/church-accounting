const assert = require('assert');
const request = require('supertest');
const app = require('../../server');
const StockReadRepository = require('../../service/stock/repositories/StockReadRepository');
const { StockMockAdapter } = require('../../service/stock/repositories/StockPostgresAdapter');

async function runTests() {
  console.log('Starting Mocked Public API Integration Tests (Supertest)...');

  // --- Scenario 1: Mock Server with normal operations ---
  process.env.STOCK_DB_ENV = 'development';
  process.env.SUPABASE_URL = 'https://booza-think.supabase.co';
  process.env.DATABASE_URL = '';

  // Explicitly inject StockMockAdapter
  app.locals.stockReadRepo = new StockReadRepository({ db: new StockMockAdapter() });
  global.stockMockCalls = [];

  let h = await request(app).get('/api/stock/health');
  assert.strictEqual(h.status, 200, 'Health should be 200');
  const hText = JSON.stringify(h.body);
  assert(!hText.includes('postgres://'), 'Sensitive info leak (DATABASE_URL)');
  assert(!hText.includes('aws-0-ap-northeast-1'), 'Sensitive info leak (Host)');
  assert(!hText.includes('zuclqyxfovktmhfzzuji'), 'Sensitive info leak (Project Ref)');

  let dataApi = await request(app).get('/api/stock/instruments');
  assert.strictEqual(dataApi.status, 200, 'Instruments should be 200');
  
  let detailApi = await request(app).get('/api/stock/instruments/005930');
  assert(detailApi.status === 200 || detailApi.status === 404, 'Detail should be 200 or 404');

  // Test Protected Routes
  let protectedApi = await request(app).post('/api/stock/ingest').send({});
  assert.strictEqual(protectedApi.status, 401, 'Protected route should block anonymous');

  let badTokenApi = await request(app).post('/api/stock/ingest').set('Authorization', 'Bearer bad_token').send({});
  assert(badTokenApi.status === 401 || badTokenApi.status === 404, 'Bad token should be 401 or 404');

  // Test mutating public routes
  let writeApi = await request(app).post('/api/stock/health');
  assert([401, 404, 405].includes(writeApi.status), 'Write to health should block');
  
  let putApi = await request(app).put('/api/stock/instruments');
  assert([401, 404, 405].includes(putApi.status), 'Write to instruments should block');

  // Check controller spy to ensure 0 calls for ingestion if unauthorized
  let calls = global.stockMockCalls || [];
  let ingestCalls = calls.filter(c => ['upsertInstruments', 'upsertDailyBars', 'insertBatch'].includes(c.method));
  assert.strictEqual(ingestCalls.length, 0, 'Ingestion repository method should not be called if unauthorized');

  // Restart server with missing DB to simulate failure
  process.env.DATABASE_URL = '';
  // re-inject to ensure it's fresh if needed, but not strictly required
  h = await request(app).get('/api/stock/health');
  assert.strictEqual(h.status, 200);
  assert.notStrictEqual(h.body.data.database, 'CONNECTED', 'Should not be CONNECTED if DB is missing');

  console.log('STOCK_PUBLIC_API_TESTS_PASS');
}

runTests().then(() => {
  process.exit(0);
}).catch(e => {
  console.error('Test Failed:', e);
  process.exit(1);
});
