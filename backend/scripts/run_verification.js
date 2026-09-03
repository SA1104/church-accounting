const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const { Pool } = require('pg');
const { KrxOpenApiProvider } = require('../service/stock/providers/KrxOpenApiProvider');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const provider = new KrxOpenApiProvider();

async function verify() {
  const client = await pool.connect();
  
  // 1. Env
  console.log("=== 1. Execution Environment ===");
  const dbRes = await client.query(`SELECT current_database() as db`);
  console.log("current_database():", dbRes.rows[0].db);
  const hostMatch = process.env.DATABASE_URL.match(/@([^:]+):/);
  const host = hostMatch ? hostMatch[1] : 'unknown';
  const maskedHost = host.substring(0, 3) + '...' + host.substring(host.length - 3);
  console.log("DB Host:", maskedHost);
  console.log("NODE_ENV:", process.env.NODE_ENV || 'development');
  console.log("STOCK_WRITE_TARGET:", process.env.STOCK_WRITE_TARGET || 'undefined');
  
  const isProd = host.includes('prod') || process.env.NODE_ENV === 'production' || process.env.STOCK_WRITE_TARGET === 'production';
  console.log("운영 DB 여부 판정:", isProd ? "PRODUCTION" : "DEVELOPMENT");
  console.log("task-6687 DB:", dbRes.rows[0].db);
  console.log("task-6597 DB:", dbRes.rows[0].db);
  
  const backfillCountRes = await client.query(`SELECT COUNT(*) as c FROM stock_daily_bars`);
  console.log("Backfill inserted rows in DB:", backfillCountRes.rows[0].c);

  // 2. Instrument Sets
  console.log("\n=== 2. Instrument Sets ===");
  const instCount = await client.query(`SELECT is_active, listing_status, COUNT(*) as c FROM stock_instruments GROUP BY is_active, listing_status`);
  console.log("Status Counts:", instCount.rows);
  const totalInst = await client.query(`SELECT COUNT(*) as c FROM stock_instruments`);
  console.log("Total:", totalInst.rows[0].c);

  // Fetch from API to get 83 excluded items
  const kospiRes = await provider.fetchDailyBars({ market: 'KOSPI', date: '20260814' });
  const kosdaqRes = await provider.fetchDailyBars({ market: 'KOSDAQ', date: '20260814' });
  
  const allRaw = [...(kospiRes.records||[]), ...(kosdaqRes.records||[])];
  
  const includedCodes = new Set();
  const dbCodes = await client.query(`SELECT stock_code FROM stock_instruments WHERE is_active = true`);
  dbCodes.rows.forEach(r => includedCodes.add(r.stock_code));
  
  const excluded = allRaw.filter(r => !includedCodes.has(r.stockCode));
  console.log(`\n=== 4. Excluded ${excluded.length} Items ===`);
  
  // Actually, KrxOpenApiProvider fetches daily bars, which don't have the rich name/security type.
  // We need to fetch instrument master.
  const kospiMaster = await provider.fetchInstruments({ market: 'KOSPI' });
  const kosdaqMaster = await provider.fetchInstruments({ market: 'KOSDAQ' });
  const allMaster = [...(kospiMaster.records||[]), ...(kosdaqMaster.records||[])];
  
  const types = {
    '보통주': 0, '우선주': 0, '종류주': 0, 'SPAC': 0, 'Mutual Fund': 0, 'ETF': 0, 'ETN': 0, '기타': 0
  };
  
  for (const item of excluded) {
    const masterInfo = allMaster.find(m => m.stockCode === item.stockCode);
    const name = masterInfo ? masterInfo.instrumentName : 'UNKNOWN';
    const kind = masterInfo ? masterInfo.securityType : 'UNKNOWN'; // security type
    
    let type = '기타';
    let rule = '기타 제외';
    
    if (name.includes('스팩') || name.includes('SPAC')) {
      type = 'SPAC'; rule = 'SPAC 제외'; types['SPAC']++;
    } else if (kind.includes('우선주')) {
      type = '우선주'; rule = '우선주 제외'; types['우선주']++;
    } else if (kind.includes('종류주')) {
      type = '종류주'; rule = '종류주 제외'; types['종류주']++;
    } else if (name.includes('펀드') || name.includes('투자') || kind.includes('투자회사')) {
      type = 'Mutual Fund'; rule = '펀드/투자회사 제외'; types['Mutual Fund']++;
    } else {
      type = '기타'; rule = '알 수 없음'; types['기타']++;
    }
    
    console.log(`[${item.stockCode}] ${name} | Security Type: ${kind} | Type: ${type} | Rule: ${rule}`);
  }
  
  console.log("Type breakdown:", types);
  
  client.release();
  pool.end();
}

verify().catch(console.error);
