const https = require('https');

function ping() {
  const url = 'https://booza-church-think.onrender.com/api/services/politics/admin/fetch-trends';
  
  const req = https.request(url, { method: 'POST' }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
      if (res.statusCode === 200) {
        console.log('Successfully triggered!');
        process.exit(0);
      } else {
        setTimeout(ping, 10000); // retry in 10s
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(e);
    setTimeout(ping, 10000);
  });
  
  req.end();
}

console.log('Waiting for Render deployment to finish and trigger data fetch...');
ping();
