/**
 * Quick test: Call Naver Search Trend API with just 2 politicians to verify connectivity.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => global.fetch(...args));

async function test() {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  console.log('Client ID:', clientId);
  console.log('Client Secret present:', !!clientSecret);

  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const body = {
    startDate: threeMonthsAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    timeUnit: 'week',
    keywordGroups: [
      { groupName: '이재명', keywords: ['이재명'] },
      { groupName: '한동훈', keywords: ['한동훈'] }
    ]
  };

  const urls = [
    'https://naverapihub.apigw.ntruss.com/search-trend/v1/search',
    'https://naveropenapi.apigw.ntruss.com/datalab/v1/search',
    'https://openapi.naver.com/v1/datalab/search'
  ];

  const headerSets = [
    { 'Content-Type': 'application/json', 'X-NCP-APIGW-API-KEY-ID': clientId, 'X-NCP-APIGW-API-KEY': clientSecret },
    { 'Content-Type': 'application/json', 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret }
  ];

  for (const url of urls) {
    for (const headers of headerSets) {
      try {
        console.log(`\n--- Testing ${url} with ${Object.keys(headers).filter(k => k !== 'Content-Type').join(', ')} ---`);
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        const text = await res.text();
        console.log(`Status: ${res.status}`);
        if (res.status === 200) {
          const data = JSON.parse(text);
          console.log('SUCCESS! Results count:', data.results?.length);
          if (data.results?.[0]?.data) {
            console.log('Sample data points:', data.results[0].data.slice(0, 3));
          }
          return; // Found working combo
        } else {
          console.log('Error:', text.substring(0, 200));
        }
      } catch (err) {
        console.log('Network error:', err.message);
      }
    }
  }
  console.log('\nAll combinations failed.');
}

test();
