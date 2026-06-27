/**
 * Booza Think Platform OS - Phase 6 Engine Integration Verification
 */
global.WebSocket = global.WebSocket || require('ws');

const http = require('http');
const path = require('path');

const PORT = 9999;
const BASE_URL = `http://localhost:${PORT}`;

// Force using mock Supabase Client instead of direct PostgreSQL pool for offline tests
process.env.DATABASE_URL = '';
process.env.SUPABASE_URL = 'https://dummy-project.supabase.co';
process.env.SUPABASE_KEY = 'dummy-key';
process.env.PORT = String(PORT);

const backendDir = path.join(__dirname, 'backend');

// 1. Require and mock initPlatformDb to bypass connection checks during offline test
const db = require(path.join(backendDir, 'core/db/index.js'));
db.initPlatformDb = async function() {
  console.log('[Test Mock] Bypassed database initialization connection check.');
};

// Mock queue worker to prevent it from looping in background
const ai = require(path.join(backendDir, 'core/ai/index.js'));
ai.startQueueWorker = async function() {
  console.log('[Test Mock] Bypassed queue worker startup.');
};

// 2. Start server programmatically
console.log('[Test Setup] Starting local Express server...');
require(path.join(backendDir, 'server.js'));

// Helper to perform HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = responseData ? JSON.parse(responseData) : null;
        } catch (e) {
          // Silent catch for non-json
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
          rawData: responseData
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(payload);
    req.end();
  });
}

// Verification Suites
async function runTests() {
  console.log('\n========================================');
  console.log(' Starting Phase 6 Engines Verification');
  console.log('========================================\n');

  let failedTests = 0;

  const testEndpoints = [
    // 1. Health Checks
    { method: 'GET', path: '/api/core/data/health', expectedStatus: 200, name: 'Data Engine Health' },
    { method: 'GET', path: '/api/core/cleaning/health', expectedStatus: 200, name: 'Cleaning Engine Health' },
    { method: 'GET', path: '/api/core/standardization/health', expectedStatus: 200, name: 'Standardization Engine Health' },
    { method: 'GET', path: '/api/core/intelligence/health', expectedStatus: 200, name: 'Intelligence Engine Health' },
    { method: 'GET', path: '/api/core/decision/health', expectedStatus: 200, name: 'Decision Engine Health' },
    { method: 'GET', path: '/api/core/media/health', expectedStatus: 200, name: 'Media Engine Health' },
    { method: 'GET', path: '/api/core/distribution/health', expectedStatus: 200, name: 'Distribution Engine Health' },
    { method: 'GET', path: '/api/core/workflow/health', expectedStatus: 200, name: 'Workflow Engine Health' },

    // 2. Execute Stubs
    { method: 'POST', path: '/api/core/data/execute', body: {}, expectedStatus: 200, name: 'Data Execute Stub' },
    { method: 'POST', path: '/api/core/cleaning/execute', body: {}, expectedStatus: 200, name: 'Cleaning Execute Stub' },
    { method: 'POST', path: '/api/core/standardization/execute', body: {}, expectedStatus: 200, name: 'Standardization Execute Stub' },
    { method: 'POST', path: '/api/core/intelligence/execute', body: {}, expectedStatus: 200, name: 'Intelligence Execute Stub' },
    { method: 'POST', path: '/api/core/decision/evaluate', body: { serviceId: 'church_think', data: { amount: 50000 } }, expectedStatus: 200, name: 'Decision Evaluate/Execute' },
    { method: 'POST', path: '/api/core/media/generate', body: { channelType: 'SHORTS', data: {} }, expectedStatus: 200, name: 'Media Generate Media Object' },
    { method: 'POST', path: '/api/core/distribution/execute', body: {}, expectedStatus: 200, name: 'Distribution Execute Stub' },
    { method: 'POST', path: '/api/core/workflow/execute', body: {}, expectedStatus: 200, name: 'Workflow Execute Stub' },

    // 3. Workflow pipeline POST /run
    { 
      method: 'POST', 
      path: '/api/core/workflow/run', 
      body: { serviceId: 'stock_think', pipeline: ['data', 'cleaning', 'intelligence', 'decision', 'media'] }, 
      expectedStatus: 200, 
      name: 'Workflow Pipeline Run (POST /run)' 
    },

    // 4. Legacy URL Compatibility
    { method: 'GET', path: '/api/organizations', expectedStatus: 500, name: 'Legacy URL Rewriting (/api/organizations)' }
  ];

  for (const t of testEndpoints) {
    try {
      const res = await makeRequest(t.method, t.path, t.body);
      if (res.statusCode === t.expectedStatus) {
        console.log(`[PASS] ${t.name} -> Status: ${res.statusCode}`);
      } else {
        console.log(`[FAIL] ${t.name} -> Expected Status: ${t.expectedStatus}, Got: ${res.statusCode}`);
        failedTests++;
      }
    } catch (error) {
      console.log(`[FAIL] ${t.name} -> Network Error:`, error.message);
      failedTests++;
    }
  }

  // Graceful test exit
  console.log('\n========================================');
  if (failedTests === 0) {
    console.log(' [SUCCESS] All Phase 6 verification tests passed!');
  } else {
    console.log(` [FAILURE] ${failedTests} test case(s) failed.`);
  }
  console.log('========================================\n');

  process.exit(failedTests === 0 ? 0 : 1);
}

// Give server time to initialize then start tests
setTimeout(runTests, 2000);
