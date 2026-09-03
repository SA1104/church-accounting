const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

require('dotenv').config({ path: path.join(__dirname, 'backend', '.env.development') });

const backend = spawn('node', ['server.js'], { 
  cwd: path.join(__dirname, 'backend'),
  env: { ...process.env }
});

backend.stdout.on('data', data => {
  const str = data.toString();
  if (str.includes('Running on http://localhost:5000')) {
    console.log('[Test] Backend is ready. Fetching DL이앤씨...');
    
    http.get('http://localhost:5000/api/stock/instruments?q=' + encodeURIComponent('DL이앤씨'), (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('\n--- CURL RESULT ---');
        console.log('HTTP Status:', res.statusCode);
        console.log('Response JSON:\n', JSON.stringify(JSON.parse(data), null, 2));
        backend.kill();
        process.exit(0);
      });
    }).on('error', (err) => {
      console.error('Error fetching:', err);
      backend.kill();
      process.exit(1);
    });
  }
});
