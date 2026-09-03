const { KrxOpenApiProvider } = require('./backend/service/stock/providers/KrxOpenApiProvider');
require('dotenv').config({path: 'backend/.env.development'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const p = new KrxOpenApiProvider();

async function run() {
  const kospiDaily = await p.fetchDailyBars({market:'KOSPI', date:'20260814'});
  const kosdaqDaily = await p.fetchDailyBars({market:'KOSDAQ', date:'20260814'});
  
  const dbInst = await pool.query('SELECT stock_code, primary_market_code FROM stock_instruments');
  const instSet = new Set(dbInst.rows.map(r => r.stock_code));
  
  const allDaily = [...(kospiDaily.records || []), ...(kosdaqDaily.records || [])];
  const missing = allDaily.filter(r => !instSet.has(r.stockCode));
  
  console.log(`Total daily records: ${allDaily.length}`);
  console.log(`Missing in DB: ${missing.length}`);
  
  // Categorize
  let etfs = 0;
  let etns = 0;
  let spack = 0;
  let others = [];
  
  for (const m of missing) {
    const rawName = m.raw?.ISU_ABBRV || m.raw?.ISU_NM || '';
    if (rawName.includes('KODEX') || rawName.includes('TIGER') || rawName.includes('KBSTAR') || rawName.includes('ARIRANG') || rawName.includes('KINDEX') || rawName.includes('ACE') || rawName.includes('HANARO') || rawName.includes('KOSEF')) {
      etfs++;
    } else if (rawName.includes('ETN')) {
      etns++;
    } else if (rawName.includes('스팩')) {
      spack++;
    } else {
      others.push(`${m.stockCode}: ${rawName} (Market: ${m.marketCode})`);
    }
  }
  
  console.log(`ETFs approx: ${etfs}`);
  console.log(`ETNs approx: ${etns}`);
  console.log(`SPACs approx: ${spack}`);
  console.log(`Others: ${others.length}`);
  console.log(others.slice(0, 20));
  
  pool.end();
}
run();
