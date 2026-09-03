const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
process.env.KRX_OPEN_API_BASE_URL = 'https://data-dbg.krx.co.kr/svc/apis/sto/';
const { KrxOpenApiProvider } = require('../service/stock/providers/KrxOpenApiProvider');

async function run() {
  const apiKey = process.env.KRX_OPEN_API_AUTH_KEY || process.env.KRX_API_KEY;
  const krx = new KrxOpenApiProvider({ apiKey });

  console.log('--- LIVE API KOSPI ---');
  try {
    const originalHttpClient = krx.httpClient.bind(krx);
    krx.httpClient = async (endpoint, params) => {
        const url = new URL((process.env.KRX_OPEN_API_BASE_URL) + endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        console.log('URL:', url.toString().replace(krx.apiKey, '***'));
        const response = await fetch(url.toString(), { headers: { 'AUTH_KEY': krx.apiKey.replace(/"/g, '') } });
        console.log('HTTP Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        const text = await response.text();
        console.log('Response body:', text);
        return {};
    };
    
    await krx.fetchInstruments({ fixture: false, market: 'KOSPI' });
    console.log('\n--- LIVE API KOSDAQ ---');
    await krx.fetchInstruments({ fixture: false, market: 'KOSDAQ' });

  } catch(e) { console.error(e); }
}
run();
