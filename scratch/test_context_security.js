const http = require('http');

function makeRequest(path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING CHURCH THINK CONTEXT SECURITY AND DB ERROR TESTS ===\n');

  // Let's first log in as Admin
  console.log('Logging in as Admin...');
  const loginRes = await makeRequest('/api/auth/login', 'POST', {}, {
    username: 'admin',
    password: 'password123'
  });

  if (loginRes.status !== 200) {
    console.error('Admin Login failed:', loginRes.body);
    process.exit(1);
  }

  const token = loginRes.body.token;
  const adminHeaders = { 'Authorization': `Bearer ${token}` };
  console.log('Admin login successful.\n');

  // Test 1: Resolve Active Project / Fallback and create Committee successfully
  console.log('[Test 1] Creating a new organization committee...');
  const orgRes = await makeRequest('/api/services/church/organizations', 'POST', adminHeaders, {
    name: '새생명위원회_' + Date.now(),
    description: '테스트용 새생명위원회'
  });
  console.log('Create Organization response status:', orgRes.status);
  console.log('Response body:', orgRes.body);
  if (orgRes.status === 201) {
    console.log('✓ Success: Organization committee created successfully.\n');
  } else {
    console.log('❌ Failure: Organization committee creation failed.\n');
  }

  // Test 2: Database detailed error exposure when creating duplicate committee
  console.log('[Test 2] Testing duplicate committee creation (expecting detailed SQL error)...');
  const duplicateName = '예배위원회';
  const dupRes = await makeRequest('/api/services/church/organizations', 'POST', adminHeaders, {
    name: duplicateName,
    description: '중복 생성 테스트'
  });
  console.log('Duplicate Create status:', dupRes.status);
  console.log('Response body (expect detailed message/details):', dupRes.body);
  if (dupRes.status === 400 && dupRes.body.message === 'Organization already exists') {
    console.log('✓ Success: Handled duplicate logic gracefully.\n');
  } else if (dupRes.status === 500 && dupRes.body.details) {
    console.log('✓ Success: Detailed database error successfully exposed:\n', dupRes.body.details, '\n');
  } else {
    console.log('❌ Failure: Detailed database error was not exposed properly.\n');
  }

  // Test 3: Standard user login
  console.log('Logging in as standard user (ullalla11)...');
  const userLogin = await makeRequest('/api/auth/login', 'POST', {}, {
    username: 'ullalla11',
    password: 'password123'
  });
  if (userLogin.status !== 200) {
    console.warn('Standard user login failed (might not be seeded). Skipping context security tests.', userLogin.body);
    return;
  }
  const userToken = userLogin.body.token;
  const userHeaders = { 'Authorization': `Bearer ${userToken}` };
  console.log('Standard user login successful.\n');

  // Test 4: Enforce context security - Standard user requests voucher from another group
  console.log('[Test 4] Standard user requesting vouchers with an unauthorized groupId...');
  const unauthorizedGroupId = 999;
  const secureRes = await makeRequest(`/api/vouchers?group=${unauthorizedGroupId}`, 'GET', userHeaders);
  console.log('Response status:', secureRes.status);
  console.log('Response body:', secureRes.body);
  if (secureRes.status === 403 && secureRes.body.error === 'FORBIDDEN_CONTEXT') {
    console.log('✓ Success: Request blocked with FORBIDDEN_CONTEXT.\n');
  } else {
    console.log('❌ Failure: Security bypass! Request was not blocked correctly.\n');
  }

  // Test 5: Enforce context security on Ledger API
  console.log('[Test 5] Standard user requesting ledger with unauthorized groupId...');
  const secureLedgerRes = await makeRequest(`/api/ledgers?yearMonth=2026-06&group=${unauthorizedGroupId}`, 'GET', userHeaders);
  console.log('Response status:', secureLedgerRes.status);
  console.log('Response body:', secureLedgerRes.body);
  if (secureLedgerRes.status === 403 && secureLedgerRes.body.error === 'FORBIDDEN_CONTEXT') {
    console.log('✓ Success: Ledger request blocked with FORBIDDEN_CONTEXT.\n');
  } else {
    console.log('❌ Failure: Security bypass on ledgers API!\n');
  }

  console.log('=== ALL TESTS COMPLETED ===');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
});
