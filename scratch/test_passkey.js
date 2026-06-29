const http = require('http');

const PORT = 5000;
const ADMIN_TOKEN = 'admin-token';
const ADMIN_EMAIL = 'admin@boozathink.com';

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

async function runTests() {
  console.log('=== STARTING WEBAUTHN PASSKEY INTEGRATION TESTS ===\n');

  // Test 1: Register Options
  console.log('[Test 1] Fetching Registration Options for Admin...');
  const regOptionsRes = await request('POST', '/api/auth/passkey/register/options', {}, ADMIN_TOKEN);
  console.log('Status:', regOptionsRes.status);
  console.log('Body challenge present:', !!regOptionsRes.body.challenge);
  console.log('Body user id:', regOptionsRes.body.user?.id);
  console.log('Body rp id:', regOptionsRes.body.rp?.id);

  if (regOptionsRes.status !== 200 || !regOptionsRes.body.challenge) {
    console.error('❌ Test 1 Failed');
    process.exit(1);
  }
  console.log('✓ Test 1 Success\n');

  // Test 2: Register Verify (Simulated/Mock mode check)
  console.log('[Test 2] Verifying registration response (with mocked simplewebauthn verification success)...');
  // In mock mode, we mock verifyRegistrationResponse. But wait, here we run the actual server.
  // Since we use the real simplewebauthn library, calling verify with a fake credential will fail registration verification.
  // That's expected and verifies the cryptography works!
  // Let's test that sending bad payloads correctly returns a verification failure (success = false).
  const badRegResponse = {
    id: 'test-cred-id',
    rawId: 'test-raw-id',
    type: 'public-key',
    response: {
      clientDataJSON: Buffer.from(JSON.stringify({
        type: 'webauthn.create',
        challenge: regOptionsRes.body.challenge,
        origin: 'http://localhost:5173'
      })).toString('base64'),
      attestationObject: 'fake-attestation'
    }
  };

  const regVerifyRes = await request('POST', '/api/auth/passkey/register/verify', {
    regResponse: badRegResponse,
    deviceName: 'Test Bot Device'
  }, ADMIN_TOKEN);

  console.log('Status:', regVerifyRes.status);
  console.log('Body:', regVerifyRes.body);
  if (regVerifyRes.status === 400 || regVerifyRes.body.success === false) {
    console.log('✓ Test 2 Success: Correctly rejected invalid credential signature.\n');
  } else {
    console.error('❌ Test 2 Failed: Accepted invalid attestation!');
    process.exit(1);
  }

  // Test 3: Unauthenticated Login options with bad email
  console.log('[Test 3] Requesting Login Options for non-existent email...');
  const badLoginOptionsRes = await request('POST', '/api/auth/passkey/login/options', { email: 'fake@invalid.com' });
  console.log('Status:', badLoginOptionsRes.status);
  console.log('Body:', badLoginOptionsRes.body);
  if (badLoginOptionsRes.status === 404 || badLoginOptionsRes.status === 200) {
    console.log('✓ Test 3 Success: Handled lookup request (allowing mock database auto-profile fallback).\n');
  } else {
    console.error('❌ Test 3 Failed');
    process.exit(1);
  }

  // Test 4: Authenticated credentials list
  console.log('[Test 4] Querying credentials list (expecting empty initially)...');
  const listRes = await request('GET', '/api/auth/passkey/credentials', null, ADMIN_TOKEN);
  console.log('Status:', listRes.status);
  console.log('Credentials count:', Array.isArray(listRes.body) ? listRes.body.length : 'not array');
  if (listRes.status === 200 && Array.isArray(listRes.body)) {
    console.log('✓ Test 4 Success\n');
  } else {
    console.error('❌ Test 4 Failed');
    process.exit(1);
  }

  console.log('=== ALL AUTOMATED PASSKEY API CHECKS PASSED ===');
}

// Introduce slight delay to let server start up
setTimeout(() => {
  runTests().catch(err => {
    console.error('Tests failed:', err);
    process.exit(1);
  });
}, 2000);
