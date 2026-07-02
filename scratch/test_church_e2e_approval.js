const http = require('http');

const SERVER_URL = 'http://localhost:5000';

async function request(endpoint, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(SERVER_URL + endpoint);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (data) {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } else {
            resolve({ status: res.statusCode, data: null });
          }
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTest() {
  console.log('--- Church Think E2E Approval Test ---');
  
  // 1. Health Check
  console.log('1. Checking Health API...');
  const healthRes = await request('/__platform_health_check__');
  console.log('Health:', healthRes.data);
  if (healthRes.status !== 200 || healthRes.data.database !== true) {
    console.error('FAILED: DB health check failed.', healthRes.data);
    process.exit(1);
  }

  // 2. Login as Finance Manager (to create voucher)
  console.log('\n2. Logging in as Finance Manager...');
  const loginRes = await request('/api/auth/login', 'POST', { username: 'finance', password: 'password123' });
  if (loginRes.status !== 200) {
    console.error('FAILED: Login as finance failed', loginRes.data);
    process.exit(1);
  }
  const financeToken = loginRes.data.token;
  console.log('Finance token obtained.');

  // 3. Create Voucher
  console.log('\n3. Creating Voucher...');
  const voucherBody = {
    transaction_date: new Date().toISOString().split('T')[0],
    amount: 50000,
    category_id: 2,
    summary: 'E2E Test Voucher',
    transaction_type: 'expense',
    vendor: 'E2E Vendor',
    payment_method: 'CARD',
    dept_head_approver_id: 'auditor-uuid-placeholder'
  };
  const createRes = await request('/api/vouchers', 'POST', voucherBody, financeToken);
  if (createRes.status !== 201) {
    console.error('FAILED: Create voucher failed', createRes.data);
    process.exit(1);
  }
  const voucherId = createRes.data.voucher_id;
  console.log(`Voucher created with ID: ${voucherId}`);

  // 4. Request Approval (Submit Draft)
  console.log('\n4. Requesting Approval (Submit Draft)...');
  const reqAppRes = await request('/api/approvals/action', 'POST', {
    targetType: 'VOUCHER',
    targetId: voucherId,
    action: 'SUBMIT',
    comment: 'Submitting E2E Test Voucher'
  }, financeToken);
  if (reqAppRes.status !== 200) {
    console.error('FAILED: Request approval failed', reqAppRes.data);
    process.exit(1);
  }
  console.log('Approval requested successfully.');

  // 5. Login as Auditor/Admin to Approve
  console.log('\n5. Logging in as Auditor...');
  const adminLoginRes = await request('/api/auth/login', 'POST', { username: 'auditor', password: 'password123' });
  if (adminLoginRes.status !== 200) {
    console.error('FAILED: Login as auditor failed', adminLoginRes.data);
    process.exit(1);
  }
  const auditorToken = adminLoginRes.data.token;
  console.log('Auditor token obtained.');

  // 6. Approve Voucher
  console.log('\n6. Approving Voucher...');
  const approveRes = await request('/api/approvals/action', 'POST', {
    targetType: 'VOUCHER',
    targetId: voucherId,
    action: 'APPROVE',
    comment: 'E2E Approved'
  }, auditorToken);
  if (approveRes.status !== 200) {
    console.error('FAILED: Approve voucher failed', approveRes.data);
    process.exit(1);
  }
  console.log('Voucher approved successfully.');

  // 7. Check Ledger
  console.log('\n7. Checking Ledger...');
  const ledgerRes = await request('/api/ledgers?yearMonth=' + new Date().toISOString().substring(0, 7), 'GET', null, auditorToken);
  if (ledgerRes.status !== 200) {
    console.error('FAILED: Fetch ledger failed', ledgerRes.data);
    process.exit(1);
  }
  const foundInLedger = ledgerRes.data.items.find(t => t.summary && t.summary.includes('E2E Test Voucher'));
  if (!foundInLedger) {
    console.error('FAILED: Voucher not found in ledger');
    process.exit(1);
  }
  console.log('Voucher successfully recorded in ledger.');
  
  console.log('\n✅ E2E Approval Test Passed!');
}

runTest().catch(console.error);
