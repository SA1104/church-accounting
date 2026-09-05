const https = require('https');

async function testApi() {
  const url = 'https://booza-church-think.onrender.com/api/services/politics/admin/test-naver-api';
  
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'POST' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', (e) => console.error(e));
    req.end();
  });
}

testApi().then(console.log);
