const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const clientId = '0jggtj5hhc';
const clientSecret = 'UfEW2DjdnrXs1zPYSlml7ob5FXhOOeuLGA9Jb0DQ';

async function testNews() {
  const url = 'https://openapi.naver.com/v1/search/news.json?query=삼성전자&display=1';
  const res = await fetch(url, {
    headers: {
      'X-NCP-APIGW-API-KEY-ID': clientId,
      'X-NCP-APIGW-API-KEY': clientSecret
    }
  });
  console.log('News Status:', res.status);
  const text = await res.text();
  console.log('News Response:', text.substring(0, 150));
}

async function testNewsApiHub() {
  const url = 'https://naverapihub.apigw.ntruss.com/search/v1/news?query=삼성전자&display=1';
  const res = await fetch(url, {
    headers: {
      'X-NCP-APIGW-API-KEY-ID': clientId,
      'X-NCP-APIGW-API-KEY': clientSecret
    }
  });
  console.log('API Hub News Status:', res.status);
  const text = await res.text();
  console.log('API Hub News Response:', text.substring(0, 150));
}

testNews().then(testNewsApiHub);
