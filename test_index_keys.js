const { KrxOpenApiProvider } = require('./backend/service/stock/providers/KrxOpenApiProvider');
require('dotenv').config({path: 'backend/.env.development'});
async function test() {
  const p = new KrxOpenApiProvider();
  const d = await p.fetchIndexDailyBars({ market: 'KOSPI', date: '20260814' });
  console.log(d.records[0]);
}
test();
