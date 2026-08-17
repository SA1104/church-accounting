const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { spawn } = require('child_process');
const assert = require('assert');

// Only run if explicitly requested
if (process.env.RUN_DB_INTEGRATION_TESTS !== '1') {
  console.log('Skipping DB integration test (RUN_DB_INTEGRATION_TESTS != 1)');
  process.exit(0);
}

const envPath = path.resolve(__dirname, '../../.env.development');
if (!fs.existsSync(envPath)) {
  console.log('Skipping DB integration test: .env.development not found');
  process.exit(0);
}
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const ACTUAL_DB_URL = envConfig.DATABASE_URL;

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runServer(envOverrides) {
  const env = { ...process.env, ...envConfig, NODE_ENV: 'development', PORT: '5001', ...envOverrides };
  const serverProcess = spawn('node', ['server.js'], { env, cwd: path.resolve(__dirname, '../../') });
  
  await wait(4000); // Wait for server to start

  return {
    kill: () => {
      serverProcess.kill('SIGTERM');
    }
  };
}

async function fetchApi(path, options = {}) {
  const res = await fetch(`http://localhost:5001${path}`, options);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch(e) {}
  return { status: res.status, json, text };
}

async function runTests() {
  console.log('Starting Public API Integration Tests...');

  // --- Scenario 1: DB Not Configured ---
  console.log('Testing: DB Not Configured');
  let srv = await runServer({ DATABASE_URL: '' });
  
  let h = await fetchApi('/api/stock/health');
  assert(h.status === 200, 'Health should be 200 even if DB not configured');
  assert(h.json.data.database === 'NOT_CONFIGURED', 'DB should be NOT_CONFIGURED');
  assert(!h.text.includes('postgres://'), 'Sensitive info leak');
  
  let dataApi = await fetchApi('/api/stock/instruments');
  assert(dataApi.status === 503, 'Data API should be 503 if DB not configured');
  srv.kill();
  await wait(1000);

  // --- Scenario 2: DB Connection Failed (Bad URL) ---
  console.log('Testing: DB Connection Failed');
  srv = await runServer({ DATABASE_URL: 'postgresql://postgres:wrong@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres' });
  
  h = await fetchApi('/api/stock/health');
  assert(h.status === 200, 'Health should be 200 even if DB fails');
  assert(h.json.data.database === 'UNAVAILABLE', 'DB should be UNAVAILABLE');
  
  dataApi = await fetchApi('/api/stock/instruments');
  assert(dataApi.status === 503, 'Data API should be 503 if DB unavailable');
  srv.kill();
  await wait(1000);

  // --- Scenario 3: DB Configured and Schema Applied ---
  console.log('Testing: Ready DB');
  srv = await runServer({ DATABASE_URL: ACTUAL_DB_URL });
  
  h = await fetchApi('/api/stock/health');
  assert(h.status === 200, 'Health should be 200');
  assert(h.json.data.database === 'CONNECTED', 'DB should be CONNECTED');
  assert(h.json.data.schema === 'APPLIED', 'Schema should be APPLIED');
  assert(!h.text.includes(envConfig.DATABASE_URL), 'No DB URL leak');
  
  dataApi = await fetchApi('/api/stock/instruments?q=test');
  assert(dataApi.status === 200, 'Instruments should be 200');
  assert(Array.isArray(dataApi.json.data), 'Instruments data should be array');
  assert(dataApi.json.meta.status === 'NO_DATA', 'Empty db should return NO_DATA');
  
  // Test Protected Routes
  let protectedApi = await fetchApi('/api/stock/research');
  assert([401, 404].includes(protectedApi.status), 'Protected route should block anonymous');
  
  let writeApi = await fetchApi('/api/stock/health', { method: 'POST' });
  assert([401, 404, 405].includes(writeApi.status), 'Write to health should block');
  
  srv.kill();
  
  console.log('STOCK_PUBLIC_API_TESTS_PASS');
  process.exit(0);
}

runTests().catch(e => {
  console.error('Test Failed:', e);
  process.exit(1);
});
