const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const assert = require('assert');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let serverProcess;

async function runServer(envOverrides) {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    await wait(1000);
  }
  const env = { ...process.env, NODE_ENV: 'test', PORT: '5001', ...envOverrides };
  serverProcess = spawn('node', ['server.js'], { env, cwd: path.resolve(__dirname, '../../') });
  
  await wait(3000); // Wait for server to start
}

async function fetchApi(path, options = {}) {
  const res = await fetch(`http://localhost:5001${path}`, options);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch(e) {}
  return { status: res.status, json, text };
}

async function runTests() {
  console.log('Starting Mocked Public API Integration Tests...');

  // --- Scenario 1: Mock Server with normal operations ---
  await runServer({ 
    STOCK_DB_ENV: 'development',
    SUPABASE_URL: 'https://booza-think.supabase.co',
    DATABASE_URL: '' // Force mock mode for Stock DB
  });
  
  let h = await fetchApi('/api/stock/health');
  assert(h.status === 200, 'Health should be 200');
  assert(!h.text.includes('postgres://'), 'Sensitive info leak (DATABASE_URL)');
  assert(!h.text.includes('aws-0-ap-northeast-1'), 'Sensitive info leak (Host)');
  assert(!h.text.includes('zuclqyxfovktmhfzzuji'), 'Sensitive info leak (Project Ref)');

  let dataApi = await fetchApi('/api/stock/instruments');
  assert(dataApi.status === 200, 'Instruments should be 200');
  
  let detailApi = await fetchApi('/api/stock/instruments/005930');
  assert(detailApi.status === 200 || detailApi.status === 404, 'Detail should be 200 or 404');

  // Test Protected Routes
  let protectedApi = await fetchApi('/api/stock/ingest', { method: 'POST', body: '{}' });
  assert(protectedApi.status === 401, 'Protected route should block anonymous');

  let badTokenApi = await fetchApi('/api/stock/ingest', { method: 'POST', headers: { 'Authorization': 'Bearer bad_token' } });
  assert(badTokenApi.status === 401 || badTokenApi.status === 404, 'Bad token should be 401 or 404');

  // Test mutating public routes
  let writeApi = await fetchApi('/api/stock/health', { method: 'POST' });
  assert([401, 404, 405].includes(writeApi.status), 'Write to health should block');
  
  let putApi = await fetchApi('/api/stock/instruments', { method: 'PUT' });
  assert([401, 404, 405].includes(putApi.status), 'Write to instruments should block');

  // Check controller spy to ensure 0 calls for ingestion if unauthorized
  let callsRes = await fetchApi('/api/test/stock-mock-calls');
  if (callsRes.status === 200) {
    let calls = callsRes.json || [];
    let ingestCalls = calls.filter(c => ['upsertInstruments', 'upsertDailyBars', 'insertBatch'].includes(c.method));
    assert(ingestCalls.length === 0, 'Ingestion repository method should not be called if unauthorized');
  }

  // Restart server with missing DB to simulate failure
  await runServer({ DATABASE_URL: '' });
  h = await fetchApi('/api/stock/health');
  assert(h.status === 200);
  assert(h.json.data.database !== 'CONNECTED', 'Should not be CONNECTED if DB is missing');

  if (serverProcess) serverProcess.kill('SIGTERM');
  
  console.log('STOCK_PUBLIC_API_TESTS_PASS');
  process.exit(0);
}

runTests().catch(e => {
  console.error('Test Failed:', e);
  if (serverProcess) serverProcess.kill('SIGTERM');
  process.exit(1);
});
