const http = require('http');

const PORT = 5000;
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const FINANCE_USERNAME = 'finance';
const FINANCE_PASSWORD = 'fin123';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const req = http.request(
      {
        host: 'localhost',
        port: PORT,
        method: method,
        path: path,
        headers: headers
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(rawData);
            resolve({ status: res.statusCode, body: data });
          } catch (e) {
            resolve({ status: res.statusCode, body: rawData });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runQaScenario() {
  console.log('==================================================');
  console.log('=== STARTING CHURCH THINK QA INTEGRATION TESTS ===');
  console.log('==================================================\n');

  // Step 1: Admin Login
  console.log('[Step 1] Logging in as Admin...');
  const adminLoginRes = await request('POST', '/api/auth/login', {
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD
  });
  console.log('Status:', adminLoginRes.status);
  const adminToken = adminLoginRes.body.token;
  const adminUserId = adminLoginRes.body.user.id;
  console.log('Admin Token:', adminToken);
  console.log('Admin User ID:', adminUserId);
  if (adminLoginRes.status !== 200 || !adminToken) {
    console.error('❌ Step 1 Failed: Admin login failed.');
    process.exit(1);
  }
  console.log('✓ Step 1 Success\n');

  // Step 2: Create Committee
  console.log('[Step 2] Creating a new Committee (선교위원회_QA)...');
  const orgName = `선교위원회_QA_${Date.now()}`;
  const createOrgRes = await request('POST', '/api/organizations', {
    name: orgName,
    description: 'QA 테스트용 해외 선교 특화 위원회'
  }, adminToken);
  console.log('Status:', createOrgRes.status);
  console.log('Body:', createOrgRes.body);
  const organizationId = createOrgRes.body.id;
  if (createOrgRes.status !== 201 || !organizationId) {
    console.error('❌ Step 2 Failed: Organization creation failed.');
    process.exit(1);
  }
  console.log('✓ Step 2 Success. Committee ID:', organizationId, '\n');

  // Step 3: Create Group
  console.log('[Step 3] Creating a new Group (해외선교팀_QA) inside Committee...');
  const groupName = `해외선교팀_QA_${Date.now()}`;
  const createGroupRes = await request('POST', '/api/groups', {
    organization_id: organizationId,
    name: groupName,
    description: 'QA 테스트용 해외 선교 파견 부서'
  }, adminToken);
  console.log('Status:', createGroupRes.status);
  console.log('Body:', createGroupRes.body);
  const groupId = createGroupRes.body.id;
  if (createGroupRes.status !== 201 || !groupId) {
    console.error('❌ Step 3 Failed: Group creation failed.');
    process.exit(1);
  }
  console.log('✓ Step 3 Success. Group ID:', groupId, '\n');

  // Step 4: User Signup
  console.log('[Step 4] Simulating new User Signup (김선교)...');
  const testUsername = `qa_user_${Date.now()}@boozathink.com`;
  const testPassword = `password123`;
  const signupRes = await request('POST', '/api/auth/signup', {
    username: testUsername,
    password: testPassword,
    name: '김선교',
    churchProfileId: 'church-id-placeholder',
    departmentId: organizationId,
    groupId: groupId,
    signature: '김선교 (인)'
  });
  console.log('Status:', signupRes.status);
  console.log('Body:', signupRes.body);
  if (signupRes.status !== 201) {
    console.error('❌ Step 4 Failed: User signup failed.');
    process.exit(1);
  }
  console.log('✓ Step 4 Success\n');

  // Step 5: Fetch and Approve User
  console.log('[Step 5] Fetching pending users and approving "김선교"...');
  const userListRes = await request('GET', '/api/users', null, adminToken);
  if (userListRes.status !== 200 || !Array.isArray(userListRes.body)) {
    console.error('❌ Step 5 Failed: Could not fetch user list.');
    process.exit(1);
  }
  const newUser = userListRes.body.find(u => u.username === testUsername);
  if (!newUser) {
    console.error('❌ Step 5 Failed: Signed up user not found in user list.');
    process.exit(1);
  }
  const newUserId = newUser.user_id;
  console.log('Signed up User ID:', newUserId);

  const approveRes = await request('POST', `/api/users/${newUserId}/approve`, {}, adminToken);
  console.log('Approve Status:', approveRes.status);
  console.log('Approve Body:', approveRes.body);
  if (approveRes.status !== 200) {
    console.error('❌ Step 5 Failed: User approval failed.');
    process.exit(1);
  }
  console.log('✓ Step 5 Success\n');

  // Step 6: Log in as the newly approved user
  console.log('[Step 6] Logging in as newly approved user "김선교"...');
  const userLoginRes = await request('POST', '/api/auth/login', {
    username: testUsername,
    password: testPassword
  });
  console.log('Status:', userLoginRes.status);
  const userToken = userLoginRes.body.token;
  console.log('User Token:', userToken);
  if (userLoginRes.status !== 200 || !userToken) {
    console.error('❌ Step 6 Failed: User login failed.');
    process.exit(1);
  }
  console.log('✓ Step 6 Success\n');

  // Step 7: Create Voucher (전표 등록)
  console.log('[Step 7] Creating a new Voucher (TEMP status)...');
  const createVoucherRes = await request('POST', '/api/vouchers', {
    transaction_date: '2026-06-25',
    transaction_type: 'EXPENSE',
    category_id: 1,
    summary: '해외 선교 훈련생 식대 지원 청구',
    vendor: 'QA 선교식당',
    amount: 150000,
    payment_method: 'CARD',
    memo: 'QA E2E E2E E2E',
    dept_head_approver_id: 'finance-uuid-placeholder',
    finance_approver_id: 'admin-uuid-placeholder'
  }, userToken);
  console.log('Status:', createVoucherRes.status);
  console.log('Body:', createVoucherRes.body);
  const voucherId = createVoucherRes.body.voucher_id;
  if (createVoucherRes.status !== 201 || !voucherId) {
    console.error('❌ Step 7 Failed: Voucher creation failed.');
    process.exit(1);
  }
  console.log('✓ Step 7 Success. Voucher ID:', voucherId, '\n');

  // Step 8: Submit Voucher for Approval (결재 기안 상신)
  console.log('[Step 8] Submitting voucher for approval...');
  const submitRes = await request('POST', '/api/approvals/action', {
    targetType: 'VOUCHER',
    targetId: voucherId,
    action: 'SUBMIT',
    comment: '해외 선교비 경비 상신청구',
    signature: '김선교 (인)'
  }, userToken);
  console.log('Status:', submitRes.status);
  console.log('Body:', submitRes.body);
  if (submitRes.status !== 200) {
    console.error('❌ Step 8 Failed: Voucher submission failed.');
    process.exit(1);
  }
  console.log('✓ Step 8 Success\n');

  // Step 9: Department Head Approval
  console.log('[Step 9] Logging in as Dept Head (finance) and approving step 1...');
  const financeLoginRes = await request('POST', '/api/auth/login', {
    username: FINANCE_USERNAME,
    password: FINANCE_PASSWORD
  });
  const financeToken = financeLoginRes.body.token;
  if (!financeToken) {
    console.error('❌ Step 9 Failed: Dept head login failed.');
    process.exit(1);
  }

  const deptApproveRes = await request('POST', '/api/approvals/action', {
    targetType: 'VOUCHER',
    targetId: voucherId,
    action: 'APPROVE',
    comment: '부서장 검토 완료 승인',
    signature: '이재정 (인)'
  }, financeToken);
  console.log('Status:', deptApproveRes.status);
  console.log('Body:', deptApproveRes.body);
  if (deptApproveRes.status !== 200) {
    console.error('❌ Step 9 Failed: Dept head approval failed.');
    process.exit(1);
  }
  console.log('✓ Step 9 Success\n');

  // Step 10: Finance Manager Approval (Final)
  console.log('[Step 10] Approving step 2 as Final Finance Approver (admin)...');
  const finalApproveRes = await request('POST', '/api/approvals/action', {
    targetType: 'VOUCHER',
    targetId: voucherId,
    action: 'APPROVE',
    comment: '재정부 기장 처리 승인',
    signature: '관리자 (인)'
  }, adminToken);
  console.log('Status:', finalApproveRes.status);
  console.log('Body:', finalApproveRes.body);
  if (finalApproveRes.status !== 200) {
    console.error('❌ Step 10 Failed: Final approval failed.');
    process.exit(1);
  }
  console.log('✓ Step 10 Success\n');

  // Step 11: Auditor Check
  console.log('[Step 11] Running Audit Check (Retrieving auditor attachments)...');
  const auditRes = await request('GET', '/api/vouchers/auditor/attachments', null, adminToken);
  console.log('Status:', auditRes.status);
  console.log('Attachments items count:', Array.isArray(auditRes.body) ? auditRes.body.length : 'not array');
  if (auditRes.status !== 200) {
    console.error('❌ Step 11 Failed: Auditor lookup failed.');
    process.exit(1);
  }
  console.log('✓ Step 11 Success\n');

  // Step 12: Period Lock (결산)
  console.log('[Step 12] Closing and locking the period 2026-06...');
  const lockRes = await request('POST', '/api/period-locks/lock', {
    periodType: 'MONTH',
    periodValue: '2026-06'
  }, adminToken);
  console.log('Status:', lockRes.status);
  console.log('Body:', lockRes.body);
  if (lockRes.status !== 200 && lockRes.status !== 201) {
    console.error('❌ Step 12 Failed: Period lock failed.');
    process.exit(1);
  }
  console.log('✓ Step 12 Success\n');

  // Step 13: Verify Period Lock Protection
  console.log('[Step 13] Verifying period lock protection (attempting to create voucher in locked period)...');
  const lockedVoucherRes = await request('POST', '/api/vouchers', {
    transaction_date: '2026-06-25',
    transaction_type: 'EXPENSE',
    category_id: 1,
    summary: '식대 지원 청구 (마감 후 오버플로우 테스트)',
    vendor: 'QA 선교식당',
    amount: 10000,
    payment_method: 'CARD',
    memo: 'THIS MUST FAIL'
  }, userToken);
  console.log('Status (expecting 400):', lockedVoucherRes.status);
  console.log('Body:', lockedVoucherRes.body);
  if (lockedVoucherRes.status === 400) {
    console.log('✓ Step 13 Success: Transaction blocked correctly under locked period.\n');
  } else {
    console.error('❌ Step 13 Failed: Period lock did not protect transaction creation!');
    process.exit(1);
  }

  console.log('======================================================');
  console.log('=== ALL QA WORKFLOW SCENARIO INTEGRATION TESTS OK ===');
  console.log('======================================================');
}

// Delay to allow server to boot up
setTimeout(() => {
  runQaScenario().catch(err => {
    console.error('QA Scenario run error:', err);
    process.exit(1);
  });
}, 2000);
