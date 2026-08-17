const assert = require('assert');
const request = require('supertest');
const app = require('../../server');

// Mock Auth Client
const authClientCalls = [];
const mockAuthClient = {
  resend: async (args) => {
    authClientCalls.push({ method: 'resend', args });
    const { email } = args || {};
    if (email === '429@example.invalid') return { error: { status: 429, message: 'Rate limit' } };
    if (email === '500@example.invalid') return { error: { status: 500, message: 'Server error' } };
    return (email && email.endsWith('.invalid')) ? { data: {} } : { error: { message: 'Real test not allowed' } };
  }
};

// Inject mock client
app.locals.authClient = mockAuthClient;

async function runTests() {
  console.log('--- Testing Auth Resend Confirmation (Supertest) ---');
  
  process.env.EMAIL_CONFIRM_REDIRECT_URL = 'https://boozathink.com/login';
  delete process.env.MOCK_PROD_REDIRECT;

  // 1. Success case
  authClientCalls.length = 0;
  let res = await request(app)
    .post('/api/auth/resend-confirmation')
    .send({ email: 'masked-test@example.invalid' });
  
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert(res.body.message.includes('재발송이 가능한 계정이라면 가입 확인 메일을 보내드렸습니다'));
  
  assert.strictEqual(authClientCalls.length, 1, 'auth.resend must be called exactly once');
  assert.strictEqual(authClientCalls[0].args.type, 'signup', 'auth.resend type must be signup');
  assert.strictEqual(authClientCalls[0].args.email, 'masked-test@example.invalid', 'auth.resend email must be exact');
  assert.strictEqual(authClientCalls[0].args.options.emailRedirectTo, 'https://boozathink.com/login', 'auth.resend emailRedirectTo must be exact');

  // 2. Whitespace trimming
  authClientCalls.length = 0;
  res = await request(app)
    .post('/api/auth/resend-confirmation')
    .send({ email: '  masked-test@example.invalid  ' });
  assert.strictEqual(res.status, 200, 'Whitespace should be trimmed');
  assert.strictEqual(authClientCalls[0].args.email, 'masked-test@example.invalid', 'Email must be trimmed');

  // 3. Uppercase to lowercase
  authClientCalls.length = 0;
  res = await request(app)
    .post('/api/auth/resend-confirmation')
    .send({ email: 'MASKED-TEST@EXAMPLE.INVALID' });
  assert.strictEqual(res.status, 200, 'Uppercase should be normalized');
  assert.strictEqual(authClientCalls[0].args.email, 'masked-test@example.invalid', 'Email must be lowercase');

  // 4. Invalid email format
  res = await request(app)
    .post('/api/auth/resend-confirmation')
    .send({ email: 'not-an-email' });
  assert.strictEqual(res.status, 400);
  assert(res.body.message.includes('이메일 형식을 확인해 주세요.'));

  // 5. Missing email
  res = await request(app)
    .post('/api/auth/resend-confirmation')
    .send({});
  assert.strictEqual(res.status, 400);

  // 6. Invalid types (array, object)
  res = await request(app).post('/api/auth/resend-confirmation').set('X-Forwarded-For', '2.2.2.2').send({ email: [] });
  assert.strictEqual(res.status, 400);

  res = await request(app).post('/api/auth/resend-confirmation').set('X-Forwarded-For', '2.2.2.2').send({ email: {} });
  assert.strictEqual(res.status, 400);

  // 7. CR/LF in email
  res = await request(app).post('/api/auth/resend-confirmation').set('X-Forwarded-For', '2.2.2.2').send({ email: 'us\ner@example.com' });
  assert.strictEqual(res.status, 400);

  // 8. Supabase 429
  res = await request(app).post('/api/auth/resend-confirmation').set('X-Forwarded-For', '3.3.3.3').send({ email: '429@example.invalid' });
  assert.strictEqual(res.status, 429);

  // 9. Supabase 5xx
  res = await request(app).post('/api/auth/resend-confirmation').set('X-Forwarded-For', '3.3.3.3').send({ email: '500@example.invalid' });
  assert.strictEqual(res.status, 503);

  // 10. Rate Limiter (6th request should hit 429)
  let rateLimitHit = false;
  for(let i = 0; i < 6; i++) {
    const r = await request(app).post('/api/auth/resend-confirmation').set('X-Forwarded-For', '4.4.4.4').send({ email: 'ratelimit@example.invalid' });
    if (r.status === 429) {
      rateLimitHit = true;
      break;
    }
  }
  assert(rateLimitHit, 'Rate limiter should kick in');

  // 11. Missing Redirect Config
  process.env.EMAIL_CONFIRM_REDIRECT_URL = '';
  process.env.MOCK_PROD_REDIRECT = '1';
  res = await request(app).post('/api/auth/resend-confirmation').set('X-Forwarded-For', '5.5.5.5').send({ email: 'masked-test@example.invalid' });
  assert.strictEqual(res.status, 503);

  // 12. Localhost Redirect blocked in production
  process.env.EMAIL_CONFIRM_REDIRECT_URL = 'http://localhost:3000/login';
  res = await request(app).post('/api/auth/resend-confirmation').set('X-Forwarded-For', '6.6.6.6').send({ email: 'masked-test@example.invalid' });
  assert.strictEqual(res.status, 503);

  console.log('Auth Resend tests passed.');
}

runTests().then(() => {
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
