const { KrxOpenApiProvider } = require('./backend/service/stock/providers/KrxOpenApiProvider');
require('dotenv').config({path: 'backend/.env.development'});

async function testIndex() {
  const p = new KrxOpenApiProvider();
  
  const testEndpoints = [
    { ep: 'idx/kospi_dd_trd', params: { basDd: '20260814' } },
    { ep: 'idx/kosdaq_dd_trd', params: { basDd: '20260814' } }
  ];
  for (const {ep, params} of testEndpoints) {
    try {
      const res = await p.httpClient(ep, params);
      console.log('Success for', ep, res.OutBlock_1 ? res.OutBlock_1.length + ' rows' : res);
    } catch(e) {
      console.log('Failed for', ep, params, e.message);
    }
  }
}
testIndex();
