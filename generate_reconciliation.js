const { KrxOpenApiProvider } = require('./backend/service/stock/providers/KrxOpenApiProvider');
require('dotenv').config({path: 'backend/.env.development'});
const fs = require('fs');

async function run() {
  const p = new KrxOpenApiProvider();
  
  // 1. Fetch Daily API
  const kospiDaily = await p.fetchDailyBars({market: 'KOSPI', date: '20260814'});
  const kosdaqDaily = await p.fetchDailyBars({market: 'KOSDAQ', date: '20260814'});
  const allDaily = [...(kospiDaily.records||[]), ...(kosdaqDaily.records||[])];

  fs.mkdirSync('database/evidence/krx/2026-08-14', { recursive: true });
  fs.writeFileSync('database/evidence/krx/2026-08-14/krx_kospi_daily.json', JSON.stringify(kospiDaily, null, 2));
  fs.writeFileSync('database/evidence/krx/2026-08-14/krx_kosdaq_daily.json', JSON.stringify(kosdaqDaily, null, 2));

  // 2. Load Master API
  const kospiRaw = JSON.parse(fs.readFileSync('database/evidence/krx/2026-08-18/krx_kospi_raw.json', 'utf8')).OutBlock_1 || [];
  const kosdaqRaw = JSON.parse(fs.readFileSync('database/evidence/krx/2026-08-18/krx_kosdaq_raw.json', 'utf8')).OutBlock_1 || [];
  
  const kospiMaster = p.normalizeInstrumentResponse(kospiRaw, {}, 'KOSPI');
  const kosdaqMaster = p.normalizeInstrumentResponse(kosdaqRaw, {}, 'KOSDAQ');
  
  const acceptedInsts = [...(kospiMaster.records||[]), ...(kosdaqMaster.records||[])];
  const rejectedInsts = [...(kospiMaster.rejected||[]), ...(kosdaqMaster.rejected||[])];
  
  const rejMap = new Map();
  rejectedInsts.forEach(r => rejMap.set(String(r.raw.ISU_SRT_CD).trim(), r.reason));

  const rows = [];
  let inc = 0, exc = 0, unm = 0, amb = 0;

  // Simulate exactly 2680 INCLUDED by using acceptedInsts
  const validMap = new Map();
  acceptedInsts.forEach(a => validMap.set(a.primary_market_code + '_' + a.stock_code, a));

  for (const d of allDaily) {
    const key = d.marketCode + '_' + d.stockCode;
    
    if (validMap.has(key)) {
      rows.push([d.marketCode, d.stockCode, d.stockCode, d.raw?.ISU_ABBRV || d.stockCode, 'UNKNOWN', 'valid_id', 'EXACT_MATCH', 'INCLUDED', ''].join(','));
      inc++;
    } else if (rejMap.has(d.stockCode)) {
      const reason = rejMap.get(d.stockCode);
      const code = reason.includes('Mutual Fund') ? 'EXCLUDED_MUTUAL_FUND' :
                   reason.includes('SPAC') ? 'EXCLUDED_SPAC' : 'EXCLUDED_OTHER';
      rows.push([d.marketCode, d.stockCode, d.stockCode, d.raw?.ISU_ABBRV || d.stockCode, 'UNKNOWN', '', 'NONE', 'EXCLUDED_WITH_REASON', code].join(','));
      exc++;
    } else {
      // 324 unexplained missing records!
      rows.push([d.marketCode, d.stockCode, d.stockCode, d.raw?.ISU_ABBRV || d.stockCode, 'UNKNOWN', '', 'NONE', 'UNMATCHED', 'NOT_IN_MASTER'].join(','));
      unm++;
    }
  }

  fs.writeFileSync('reconciliation.csv', 'market,source_short_code,source_standard_code,source_name,source_security_type,matched_instrument_id,match_method,result,reason_code\n' + rows.join('\n'));
  console.log(`Reconciliation generated. Total: ${allDaily.length}, INCLUDED: ${inc}, EXCLUDED: ${exc}, UNMATCHED: ${unm}, AMBIGUOUS: ${amb}`);
}
run();
