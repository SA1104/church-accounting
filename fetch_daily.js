const { KrxOpenApiProvider } = require('./backend/service/stock/providers/KrxOpenApiProvider');
require('dotenv').config({path: 'backend/.env.development'});
const fs = require('fs');
const path = require('path');

async function fetchAndSave() {
  const p = new KrxOpenApiProvider();
  
  const dir = 'database/evidence/krx/2026-08-14';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log('Fetching KOSPI...');
  const kospiRes = await p.httpClient(p.KRX_API.endpoints.kospiDaily, { [p.KRX_API.queryDateField]: '20260814' });
  fs.writeFileSync(path.join(dir, 'krx_kospi_daily.json'), JSON.stringify(kospiRes, null, 2));

  console.log('Fetching KOSDAQ...');
  const kosdaqRes = await p.httpClient(p.KRX_API.endpoints.kosdaqDaily, { [p.KRX_API.queryDateField]: '20260814' });
  fs.writeFileSync(path.join(dir, 'krx_kosdaq_daily.json'), JSON.stringify(kosdaqRes, null, 2));

  console.log('Done fetching daily bars.');
}

fetchAndSave();
