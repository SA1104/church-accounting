const https = require('https');

async function run() {
  const url = 'https://booza-church-think.onrender.com/api/services/politics/admin/cron-logs';
  const req = https.request(url, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => console.log(JSON.parse(data)));
  });
  req.end();
}
run();
