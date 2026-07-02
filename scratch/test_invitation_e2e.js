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
  console.log('--- Church Think V1.1 E2E Invitation Test ---');

  // 1. Login as Admin
  console.log('\n1. Logging in as Admin...');
  const loginRes = await request('/api/auth/login', 'POST', { username: 'admin', password: 'password123' });
  if (loginRes.status !== 200) {
    console.error('FAILED: Login as admin failed', loginRes.data);
    process.exit(1);
  }
  const adminToken = loginRes.data.token;
  console.log('Admin token obtained.');

  // 2. Fetch positions to find an active position
  console.log('\n2. Fetching positions...');
  const posRes = await request('/api/church/positions', 'GET', null, adminToken);
  if (posRes.status !== 200 || !posRes.data.length) {
    console.error('FAILED: Fetching positions failed', posRes.data);
    process.exit(1);
  }
  const position = posRes.data[0];
  console.log(`Using position: ${position.name} (${position.position_id})`);

  // 3. Create Invitation
  console.log('\n3. Creating Invitation...');
  const inviteBody = {
    email: 'member_test@boozathink.com',
    name: 'Member Test',
    phone: '010-1234-5678',
    committee_id: 11, // Education Committee ID (usually 11 in seed data)
    position_id: position.position_id,
    role: 'member',
    message: 'Welcome to the middle school department!',
    expires_in_days: 7
  };
  const createInviteRes = await request('/api/church/invitations', 'POST', inviteBody, adminToken);
  if (createInviteRes.status !== 201) {
    console.error('FAILED: Invitation creation failed', createInviteRes.data);
    process.exit(1);
  }
  const token = createInviteRes.data.token;
  console.log(`Invitation created successfully. Token: ${token}`);

  // 4. Fetch details (Public)
  console.log('\n4. Fetching invitation details publicly...');
  const detailRes = await request(`/api/church/invitations/${token}`, 'GET');
  if (detailRes.status !== 200) {
    console.error('FAILED: Fetching invitation details publicly failed', detailRes.data);
    process.exit(1);
  }
  console.log('Invitation details:', detailRes.data);
  if (detailRes.data.invited_email !== 'member_test@boozathink.com' || detailRes.data.accountExists !== false) {
    console.error('FAILED: Mismatched details or accountExists state');
    process.exit(1);
  }

  // 5. Signup invited user
  console.log('\n5. Signing up the invited user...');
  const signupRes = await request('/api/auth/signup', 'POST', {
    name: 'Member Test',
    email: 'member_test@boozathink.com',
    username: 'member_test@boozathink.com',
    password: 'password123',
    phone: '+82 010-1234-5678'
  });
  if (signupRes.status !== 201) {
    console.error('FAILED: Signup failed', signupRes.data);
    process.exit(1);
  }
  console.log('Signup completed successfully.');

  // 6. Log in as new user
  console.log('\n6. Logging in as the new user...');
  const userLoginRes = await request('/api/auth/login', 'POST', {
    username: 'member_test@boozathink.com',
    password: 'password123'
  });
  if (userLoginRes.status !== 200) {
    console.error('FAILED: Login as new user failed', userLoginRes.data);
    process.exit(1);
  }
  const userToken = userLoginRes.data.token;
  console.log('New user token obtained.');

  // 7. Accept invitation
  console.log('\n7. Accepting invitation...');
  const acceptRes = await request(`/api/church/invitations/${token}/accept`, 'POST', null, userToken);
  if (acceptRes.status !== 200) {
    console.error('FAILED: Accepting invitation failed', acceptRes.data);
    process.exit(1);
  }
  console.log('Invitation accepted successfully.');

  // 8. Verify assignments
  console.log('\n8. Verifying assignments for new user...');
  const meRes = await request('/api/church/assignments/me', 'GET', null, userToken);
  if (meRes.status !== 200 || !meRes.data.length) {
    console.error('FAILED: Fetching assignments failed', meRes.data);
    process.exit(1);
  }
  const assignment = meRes.data[0];
  console.log('Active assignment:', assignment);
  if (assignment.is_active !== 1 && assignment.is_active !== true) {
    console.error('FAILED: Assignment is not active');
    process.exit(1);
  }

  // 9. Verify history logs
  console.log('\n9. Verifying history logs for new user...');
  const historyRes = await request('/api/church/invitations/history', 'GET', null, userToken);
  if (historyRes.status !== 200 || !historyRes.data.length) {
    console.error('FAILED: Fetching assignment history failed', historyRes.data);
    process.exit(1);
  }
  console.log('Assignment history log:', historyRes.data[0]);
  const hasAcceptedLog = historyRes.data.some(h => h.change_type === 'accepted');
  if (!hasAcceptedLog) {
    console.error('FAILED: Accepted log not found in history');
    process.exit(1);
  }

  console.log('\n✅ E2E Invitation Test Passed!');
}

runTest().catch(console.error);
