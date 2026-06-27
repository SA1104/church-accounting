const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching live index.html...');
  try {
    const indexRes = await fetchUrl('https://booza-church-think.onrender.com/');
    console.log(`index.html Status: ${indexRes.statusCode}`);
    
    // Parse assets
    const jsRegex = /src="(\/assets\/index-.*?\.js)"/;
    const cssRegex = /href="(\/assets\/index-.*?\.css)"/;
    
    const jsMatch = indexRes.body.match(jsRegex);
    const cssMatch = indexRes.body.match(cssRegex);
    
    if (jsMatch) {
      const jsUrl = `https://booza-church-think.onrender.com${jsMatch[1]}`;
      console.log(`Detected JS Asset URL: ${jsUrl}`);
      const jsRes = await fetchUrl(jsUrl);
      console.log(`JS Asset Status: ${jsRes.statusCode}`);
      if (jsRes.statusCode === 200) {
        console.log(`JS File starts with: ${jsRes.body.substring(0, 100)}`);
      }
    } else {
      console.log('No JS asset match found in index.html.');
    }

    if (cssMatch) {
      const cssUrl = `https://booza-church-think.onrender.com${cssMatch[1]}`;
      console.log(`Detected CSS Asset URL: ${cssUrl}`);
      const cssRes = await fetchUrl(cssUrl);
      console.log(`CSS Asset Status: ${cssRes.statusCode}`);
    }
  } catch (e) {
    console.error('Error fetching live URL:', e.message);
  }
}

run();
