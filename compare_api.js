const { KrxOpenApiProvider } = require('./backend/service/stock/providers/KrxOpenApiProvider');
require('dotenv').config({path: 'backend/.env.development'});
const fs = require('fs');

async function run() {
  const p = new KrxOpenApiProvider();
  
  const kospiDaily = await p.fetchDailyBars({market: 'KOSPI', date: '20260814'});
  const kosdaqDaily = await p.fetchDailyBars({market: 'KOSDAQ', date: '20260814'});
  const allDaily = [...(kospiDaily.records||[]), ...(kosdaqDaily.records||[])];

  const kospiRaw = JSON.parse(fs.readFileSync('database/evidence/krx/2026-08-18/krx_kospi_raw.json', 'utf8')).OutBlock_1 || [];
  const kosdaqRaw = JSON.parse(fs.readFileSync('database/evidence/krx/2026-08-18/krx_kosdaq_raw.json', 'utf8')).OutBlock_1 || [];
  const allMaster = [...kospiRaw, ...kosdaqRaw];

  const dailySet = new Set(allDaily.map(d => d.stockCode));
  const masterSet = new Set(allMaster.map(m => String(m.ISU_SRT_CD).trim()));

  const dailyOnly = allDaily.filter(d => !masterSet.has(d.stockCode));
  const masterOnly = allMaster.filter(m => !dailySet.has(String(m.ISU_SRT_CD).trim()));

  console.log(`Total Daily: ${allDaily.length}, Total Master: ${allMaster.length}`);
  console.log(`In Daily, but NOT in Master: ${dailyOnly.length}`);
  console.log(`In Master, but NOT in Daily: ${masterOnly.length}`);
}
run();
