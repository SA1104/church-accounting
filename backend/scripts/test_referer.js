const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const clientId = '0jggtj5hhc';
const clientSecret = 'UfEW2DjdnrXs1zPYSlml7ob5FXhOOeuLGA9Jb0DQ';

async function testWithReferer() {
  const url = 'https://naverapihub.apigw.ntruss.com/search/v1/news?query=삼성전자&display=1';
  const res = await fetch(url, {
    headers: {
      'X-NCP-APIGW-API-KEY-ID': clientId,
      'X-NCP-APIGW-API-KEY': clientSecret,
      'Referer': 'https://boozathink.com',
      'User-Agent': 'Mozilla/5.0'
    }
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}

testWithReferer();
