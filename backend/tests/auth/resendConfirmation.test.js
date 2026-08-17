const assert = require('assert');
const { spawn } = require('child_process');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let serverProcess;

async function startServer(envOverrides) {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    await wait(1000);
  }
  const env = { ...process.env, NODE_ENV: 'test', PORT: '5002', ...envOverrides };
  serverProcess = spawn('node', ['server.js'], { env, cwd: require('path').resolve(__dirname, '../../') });
  serverProcess.stdout.on('data', d => console.log('SERVER:', d.toString()));
  serverProcess.stderr.on('data', d => console.error('SERVER ERR:', d.toString()));
  await wait(3000); // Wait for server to start
}

async function stopServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
    await wait(1000);
  }
}

async function runTests() {
  console.log('--- Testing Auth Resend Confirmation ---');
  
  await startServer({ EMAIL_CONFIRM_REDIRECT_URL: 'https://boozathink.com/login' });

  // 1, 15, 16, 17, 18, 19
  await fetch('http://localhost:5002/api/test/auth-mock-calls/reset', { method: 'POST' });
  let res = await fetch('http://localhost:5002/api/auth/resend-confirmation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'masked-test@example.invalid' })
  });
  let json = await res.json();
  if (res.status !== 200) console.log(res.status, json);
  assert(res.status === 200);
  assert(json.success === true);
  assert(json.message.includes('재발송이 가능한 계정이라면 가입 확인 메일을 보내드렸습니다. 메일함과 스팸함을 확인해 주세요.'));
  
  let callsRes = await fetch('http://localhost:5002/api/test/auth-mock-calls');
  let calls = await callsRes.json();
  assert(calls.length === 1, 'auth.resend must be called exactly once');
  assert(calls[0].args.type === 'signup', 'auth.resend type must be signup');
  assert(calls[0].args.email === 'masked-test@example.invalid', 'auth.resend email must be exact');
  assert(calls[0].args.options.emailRedirectTo === 'https://boozathink.com/login', 'auth.resend emailRedirectTo must be exactly the server resolved one');

  // 2. 앞뒤 공백 제거
  await fetch('http://localhost:5002/api/test/auth-mock-calls/reset', { method: 'POST' });
  res = await fetch('http://localhost:5002/api/auth/resend-confirmation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: '  masked-test@example.invalid  ' })
  });
  assert(res.status === 200, 'Whitespace should be trimmed');
  callsRes = await fetch('http://localhost:5002/api/test/auth-mock-calls');
  calls = await callsRes.json();
  assert(calls[0].args.email === 'masked-test@example.invalid', 'Email must be trimmed before passing to Supabase');

  // 3. 대소문자 정규화
  await fetch('http://localhost:5002/api/test/auth-mock-calls/reset', { method: 'POST' });
  res = await fetch('http://localhost:5002/api/auth/resend-confirmation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'MASKED-TEST@EXAMPLE.INVALID' })
  });
  assert(res.status === 200, 'Uppercase should be normalized to lowercase');
  callsRes = await fetch('http://localhost:5002/api/test/auth-mock-calls');
  calls = await callsRes.json();
  assert(calls[0].args.email === 'masked-test@example.invalid', 'Email must be lowercase before passing to Supabase');

  // 4. 잘못된 이메일
  await fetch('http://localhost:5002/api/test/auth-mock-calls/reset', { method: 'POST' });
  res = await fetch('http://localhost:5002/api/auth/resend-confirmation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'not-an-email' })
  });
  json = await res.json();
  assert(res.status === 400);
  assert(json.message.includes('이메일 형식을 확인해 주세요.'));

  // 5. 이메일 누락
  res = await fetch('http://localhost:5002/api/auth/resend-confirmation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
  });
  assert(res.status === 400);

  // Restart server to reset memory rate limit
  await startServer({ EMAIL_CONFIRM_REDIRECT_URL: 'https://boozathink.com/login' });

  // 6. null, 배열, 객체 거부
  res = await fetch('http://localhost:5002/api/auth/resend-confirmation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: [] })
  });
  if(res.status!==400)console.log(res.status, await res.text());
  assert(res.status === 400);

  res = await fetch('http://localhost:5002/api/auth/resend-confirmation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: {} })
  });
  if(res.status!==400)console.log(res.status, await res.text());
  assert(res.status === 400);

  // 7. CR/LF 문자 거부
  res = await fetch('http://localhost:5002/api/auth/resend-confirmation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'us\ner@example.com' })
  });
  if(res.status!==400)console.log(res.status, await res.text());
  assert(res.status === 400);

  // 10. Supabase 429 -> 429
  res = await fetch('http://localhost:5002/api/auth/resend-confirmation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: '429@example.invalid' })
  });
  assert(res.status === 429);

  // 11. Supabase 5xx -> 503
  res = await fetch('http://localhost:5002/api/auth/resend-confirmation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: '500@example.invalid' })
  });
  assert(res.status === 503);

  // 20. Rate Limit 15분당 5회, 21. 중복 방지 (mock rate limiter triggers on 6th request)
  let count = 0;
  for(let i=0; i<6; i++) {
    const r = await fetch('http://localhost:5002/api/auth/resend-confirmation', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'masked-test@example.invalid' })
    });
    if (r.status === 429) count++;
  }
  assert(count > 0, 'Rate limiter should kick in');

  // Restart server to test production localhost blocks and missing config
  await startServer({ MOCK_PROD_REDIRECT: '1', EMAIL_CONFIRM_REDIRECT_URL: '' });

  // 12. Redirect 환경변수 누락 -> 503
  res = await fetch('http://localhost:5002/api/auth/resend-confirmation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'masked-test@example.invalid' })
  });
  assert(res.status === 503);

  // Restart server to test production localhost block
  await startServer({ MOCK_PROD_REDIRECT: '1', EMAIL_CONFIRM_REDIRECT_URL: 'http://localhost:3000/login' });

  // 13. production localhost Redirect 차단 -> 503
  res = await fetch('http://localhost:5002/api/auth/resend-confirmation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'masked-test@example.invalid' })
  });
  assert(res.status === 503);

  // Stop server
  await stopServer();

  console.log('Auth Resend tests passed.');
}

runTests().catch(async e => { 
  console.error(e); 
  await stopServer(); 
  process.exit(1); 
});
