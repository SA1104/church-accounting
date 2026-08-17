const express = require('express');
const request = require('supertest');
const { rateLimit } = require('express-rate-limit');

const app = express();
app.use(express.json());

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  passOnStoreError: false,
  handler: (req, res) => {
    res.status(429).json({ success: false, message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' });
  }
});

const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

app.post('/api/auth/forgot-password', forgotPasswordLimiter, (req, res) => {
  const email = req.body?.email;
  
  if (typeof email !== 'string') {
    return res.status(400).json({ success: false, message: '이메일을 입력해 주세요.' });
  }

  const cleanEmail = email.trim();

  if (!cleanEmail || cleanEmail.length > 254 || !BASIC_EMAIL_PATTERN.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: '올바른 이메일 형식을 입력해 주세요.' });
  }
  
  if (cleanEmail === 'error@boozathink.com') {
     return res.status(503).json({ success: false, message: '현재 비밀번호 재설정 메일 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.' });
  }

  res.status(200).json({ success: true, message: '입력하신 이메일로 가입된 계정이 있다면 비밀번호 재설정 안내를 발송했습니다.' });
});

async function run() {
  console.log('1. No body');
  let res = await request(app).post('/api/auth/forgot-password').send({});
  console.log(res.status, res.body);

  console.log('2. Email is not string');
  res = await request(app).post('/api/auth/forgot-password').send({ email: 123 });
  console.log(res.status, res.body);

  console.log('3. Invalid email');
  res = await request(app).post('/api/auth/forgot-password').send({ email: 'invalid' });
  console.log(res.status, res.body);

  console.log('4. Valid email');
  res = await request(app).post('/api/auth/forgot-password').send({ email: 'test@boozathink.com' });
  console.log(res.status, res.body);

  console.log('5. Rate limit test (6th request)');
  // We've already sent 4 requests (above). Let's send 1 more to hit the limit (5 total), then the 6th will fail.
  await request(app).post('/api/auth/forgot-password').send({ email: 'test@boozathink.com' });
  res = await request(app).post('/api/auth/forgot-password').send({ email: 'test@boozathink.com' });
  console.log(res.status, res.body);

  console.log('6. Supabase error simulation (new IP to bypass rate limit)');
  res = await request(app).post('/api/auth/forgot-password').set('X-Forwarded-For', '1.2.3.4').send({ email: 'error@boozathink.com' });
  console.log(res.status, res.body);
}

run();
