const https = require('https');

async function callEndpoint(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'GET' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const url = 'https://booza-church-think.onrender.com/api/services/politics/ratings/party/%EA%B5%AD%EB%AF%BC%EC%9D%98%ED%9E%98';

  console.log('Waiting for new party endpoint...');
  while (true) {
    try {
      console.log('Pinging...');
      const result = await callEndpoint(url);
      console.log('Deploy SUCCESS!', result);
      break;
    } catch (err) {
      console.error('Pending:', err.message);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

run();
