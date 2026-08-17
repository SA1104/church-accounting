const assert = require('assert');

async function runTests() {
  console.log('--- Testing Auth Resend Confirmation ---');
  let res = await fetch('http://localhost:5000/api/auth/resend-confirmation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
  });
  assert(res.status === 400, 'Missing email should be 400');

  res = await fetch('http://localhost:5000/api/auth/resend-confirmation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'invalid-email' })
  });
  assert(res.status === 400, 'Invalid email should be 400');

  res = await fetch('http://localhost:5000/api/auth/resend-confirmation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'T@EXAMPLE.invalid ' })
  });
  assert(res.status === 200, 'Valid mocked invalid email should be 200');
  
  const json = await res.json();
  assert(json.success === true, 'Should be success');
  assert(json.message.includes('가입 확인 메일'), 'Should show generic message');
  console.log('Auth Resend tests passed.');
}

runTests().catch(e => { console.error(e); process.exit(1); });
