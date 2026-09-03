const { KrxOpenApiProvider, KRX_API } = require('./backend/service/stock/providers/KrxOpenApiProvider');
require('dotenv').config({path: 'backend/.env.development'});

async function testIndex() {
  const p = new KrxOpenApiProvider();
  try {
    const res = await p.httpClient(KRX_API.endpoints.kospiDaily, { basDd: '20260814' });
    console.log('KOSPI Daily:', res.OutBlock_1[0]);
    
    const idxRes = await p.httpClient(KRX_API.endpoints.kospiIndexDaily, { basDd: '20260814' });
    console.log('KOSPI Index Daily:', idxRes.OutBlock_1 ? idxRes.OutBlock_1[0] : idxRes);
  } catch (e) {
    console.log('Error', e);
  }
}
testIndex();
