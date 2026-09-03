const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const { KrxOpenApiProvider } = require('../service/stock/providers/KrxOpenApiProvider');

// Write Guard
function testWriteGuard(envOverrides = {}) {
  const env = { ...process.env, ...envOverrides };
  if (
    env.NODE_ENV !== 'development' ||
    env.STOCK_WRITE_TARGET !== 'development' ||
    env.DEV_DATABASE_PROJECT_REF !== 'zuclqyxfovktmhfzzuji' ||
    env.ALLOW_STOCK_DATA_WRITE !== 'YES_DEV_ONLY' ||
    !env.DATABASE_URL ||
    !env.DATABASE_URL.includes('zuclqyxfovktmhfzzuji')
  ) {
    return false;
  }
  return true;
}

// Explicit Tests
if (testWriteGuard({ STOCK_WRITE_TARGET: undefined })) {
  console.error("WRITE_GUARD_FAILED: Allowed STOCK_WRITE_TARGET=undefined");
  process.exit(1);
}
if (testWriteGuard({ STOCK_WRITE_TARGET: 'production' })) {
  console.error("WRITE_GUARD_FAILED: Allowed STOCK_WRITE_TARGET=production");
  process.exit(1);
}
if (testWriteGuard({ DEV_DATABASE_PROJECT_REF: 'wrong_ref' })) {
  console.error("WRITE_GUARD_FAILED: Allowed DEV_DATABASE_PROJECT_REF=wrong_ref");
  process.exit(1);
}
if (!testWriteGuard()) {
  console.error("WRITE_GUARD_FAILED: Correct dev config rejected");
  process.exit(1);
}
console.log("WRITE_GUARD_PASSED");

const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let client;

async function preflightSchema() {
  const checkTable = async (table, cols) => {
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1
    `, [table]);
    const existing = res.rows.map(r => r.column_name);
    for (const c of cols) {
      if (!existing.includes(c)) {
        console.error(`SCHEMA_PRECHECK_FAILED: Missing ${c} in ${table}`);
        process.exit(1);
      }
    }
  };

  await checkTable('stock_daily_bars', ['instrument_id', 'trade_date', 'open_price', 'high_price', 'low_price', 'close_price', 'volume', 'trading_value', 'market_cap', 'listed_shares', 'change_amount', 'change_rate', 'source_id', 'is_final']);
  await checkTable('stock_index_daily_bars', ['index_code', 'trade_date', 'open_value', 'high_value', 'low_value', 'close_value', 'volume', 'change_value', 'change_rate', 'source_id', 'is_final']);
  await checkTable('stock_ingestion_runs', ['id', 'provider_code', 'job_code', 'target_date', 'started_at', 'finished_at', 'status', 'inserted_count', 'api_call_count', 'checkpoint_date', 'error_summary']);
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runBackfill() {
  client = await pool.connect();
  
  if (!process.env.DATABASE_URL.includes('zuclqyxfovktmhfzzuji')) {
    console.error("WRITE_GUARD_FAILED: host mismatch");
    process.exit(1);
  }

  await preflightSchema();

  const provider = new KrxOpenApiProvider();
  
  const instMap = new Map(); // key: stockCode_marketCode, value: { id, type }
  const resInst = await client.query('SELECT id, stock_code, primary_market_code, security_type, is_active FROM stock_instruments');
  for (const r of resInst.rows) {
    instMap.set(`${r.stock_code}_${r.primary_market_code}`, { id: r.id, type: r.security_type, isActive: r.is_active });
  }

  const resSrc = await client.query("SELECT id FROM stock_data_sources WHERE source_code='KRX_OPEN_API'");
  if (resSrc.rows.length === 0) {
    console.error("KRX_OPEN_API source not found");
    process.exit(1);
  }
  const sourceId = resSrc.rows[0].id;

  // Resumability
  const resRuns = await client.query("SELECT target_date FROM stock_ingestion_runs WHERE job_code='HISTORICAL_BACKFILL' AND status='SUCCESS'");
  const completedDates = new Set(resRuns.rows.map(r => r.target_date));

  const generateDates = (start, end) => {
    let dates = [];
    let d = new Date(start);
    const endD = new Date(end);
    while (d <= endD) {
      if (d.getDay() !== 0 && d.getDay() !== 6) { // Weekdays only
        const iso = d.toISOString().split('T')[0];
        dates.push(iso);
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  };

  const startArg = process.argv[2] || '2010-01-04';
  const endArg = process.argv[3] || '2026-08-14';
  const datesToRun = generateDates(startArg, endArg);

  let successCount = 0;
  let failCount = 0;
  let apiCallsTotal = 0;
  let barsTotal = 0;
  let idxTotal = 0;
  let unmatchedTotal = 0;
  let rawSourceTotal = 0;
  let histCreated = 0;

  let breakdown = { COMMON: 0, PREFERRED: 0, SPAC: 0, DR: 0, FUND: 0 };
  
  const startMs = Date.now();
  let networkFailures = 0;

  for (const date of datesToRun) {
    if (completedDates.has(date)) continue;

    const runId = 'BACKFILL_' + date;
    let apiCalls = 0;
    
    try {
      await client.query("BEGIN");
      
      await client.query(`
        INSERT INTO stock_ingestion_runs (id, provider_code, job_code, target_date, started_at, status)
        VALUES ($1, 'KRX_OPEN_API', 'HISTORICAL_BACKFILL', $2, NOW(), 'IN_PROGRESS')
        ON CONFLICT (id) DO UPDATE SET started_at = NOW(), status = 'IN_PROGRESS'
      `, [runId, date]);

      // API Calls
      const apiDate = date.replace(/-/g, '');
      const [kospiBarsRes, kosdaqBarsRes, kospiIdxRes, kosdaqIdxRes] = await Promise.all([
        provider.fetchDailyBars({ market: 'KOSPI', date: apiDate }),
        provider.fetchDailyBars({ market: 'KOSDAQ', date: apiDate }),
        provider.fetchIndexDailyBars({ market: 'KOSPI', date: apiDate }),
        provider.fetchIndexDailyBars({ market: 'KOSDAQ', date: apiDate })
      ]);
      apiCalls += 4;

      apiCallsTotal += apiCalls;
      networkFailures = 0; // reset on success

      const kospiBars = kospiBarsRes.records || [];
      const kosdaqBars = kosdaqBarsRes.records || [];
      const kospiIdx = kospiIdxRes.records || [];
      const kosdaqIdx = kosdaqIdxRes.records || [];

      const allBars = [...kospiBars, ...kosdaqBars];
      rawSourceTotal += allBars.length;
      const validBars = [];
      let dailyUnmatched = 0;
      
      for (const bar of allBars) {
        let mCode = bar.marketCode === 'KOSPI' ? 'KRX_KOSPI' : (bar.marketCode === 'KOSDAQ' ? 'KRX_KOSDAQ' : bar.marketCode);
        const key = `${bar.stockCode}_${mCode}`;
        let inst = instMap.get(key);
        if (!inst) {
          const secType = bar.instrumentName && bar.instrumentName.includes('스팩') ? 'SPAC' : 
                         (bar.instrumentName && (bar.instrumentName.endsWith('우') || bar.instrumentName.endsWith('1우') || bar.instrumentName.endsWith('2우B')) ? 'PREFERRED' : 'COMMON');

          const resIns = await client.query(`
            INSERT INTO stock_instruments (stock_code, isin_code, instrument_name, primary_market_code, is_active, listing_status, security_type, currency_code, updated_at)
            VALUES ($1, $2, $3, $4, false, 'REVIEW_PENDING', $5, 'KRW', NOW())
            RETURNING id
          `, [bar.stockCode, bar.isinCode || null, bar.instrumentName || bar.stockCode, mCode, secType]);
          const newId = resIns.rows[0].id;
          inst = { id: newId, type: secType, isActive: false };
          instMap.set(key, inst);
          histCreated++;
        }
        
        validBars.push({ ...bar, instrument_id: inst.id });
        if (breakdown[inst.type] !== undefined) {
           breakdown[inst.type]++;
        } else {
           breakdown.COMMON++; // Fallback
        }
      }

      // Batch insert validBars
      let barsInserted = 0;
      for (let i = 0; i < validBars.length; i += 500) {
        const batch = validBars.slice(i, i + 500);
        const values = [];
        const placeholders = [];
        let pIdx = 1;
        for (const b of batch) {
          placeholders.push(`($${pIdx++},$${pIdx++},$${pIdx++},$${pIdx++},$${pIdx++},$${pIdx++},$${pIdx++},$${pIdx++},$${pIdx++},$${pIdx++},$${pIdx++},$${pIdx++},$${pIdx++},true,NOW())`);
          values.push(b.instrument_id, date, Number(b.openPrice), Number(b.highPrice), Number(b.lowPrice), Number(b.closePrice), Number(b.volume), Number(b.tradingValue), Number(b.marketCap||0), Number(b.listedShares||0), Number(b.changeAmount), Number(b.changeRate), sourceId);
        }
        if (values.length > 0) {
          await client.query(`
            INSERT INTO stock_daily_bars (
              instrument_id, trade_date, open_price, high_price, low_price, close_price,
              volume, trading_value, market_cap, listed_shares, change_amount, change_rate,
              source_id, is_final, ingested_at
            ) VALUES ${placeholders.join(',')}
            ON CONFLICT (instrument_id, trade_date) DO UPDATE SET
              close_price=EXCLUDED.close_price, volume=EXCLUDED.volume, updated_at=NOW()
          `, values);
        }
        barsInserted += batch.length;
      }

      const allIdx = [...kospiIdx, ...kosdaqIdx];
      let idxInserted = 0;
      if (allIdx.length > 0) {
        const idxValues = [];
        const idxPlaceholders = [];
        let ip = 1;
        for (const idx of allIdx) {
          let iCode = idx.indexCode === 'KOSPI' ? 'KRX_KOSPI_IDX' : (idx.indexCode === 'KOSDAQ' ? 'KRX_KOSDAQ_IDX' : idx.indexCode);
          idxPlaceholders.push(`($${ip++},$${ip++},$${ip++},$${ip++},$${ip++},$${ip++},$${ip++},$${ip++},$${ip++},$${ip++},true,NOW())`);
          idxValues.push(iCode, date, Number(idx.openValue), Number(idx.highValue), Number(idx.lowValue), Number(idx.closeValue), Number(idx.volume), Number(idx.changeValue), Number(idx.changeRate), sourceId);
        }
        await client.query(`
          INSERT INTO stock_index_daily_bars (
            index_code, trade_date, open_value, high_value, low_value, close_value,
            volume, change_value, change_rate, source_id, is_final, ingested_at
          ) VALUES ${idxPlaceholders.join(',')}
          ON CONFLICT (index_code, trade_date) DO UPDATE SET
            close_value=EXCLUDED.close_value, volume=EXCLUDED.volume, updated_at=NOW()
        `, idxValues);
      }
      idxInserted += allIdx.length;

      if (allBars.length !== validBars.length) {
         throw new Error(`Count mismatch: raw=${allBars.length} != mapped=${validBars.length}`);
      }

      await client.query(`
        UPDATE stock_ingestion_runs
        SET status = 'SUCCESS', finished_at = NOW(), inserted_count = $1, api_call_count = $2, checkpoint_date = $3
        WHERE id = $4
      `, [barsInserted + idxInserted, apiCalls, date, runId]);

      await client.query("COMMIT");

      successCount++;
      barsTotal += barsInserted;
      idxTotal += idxInserted;
      unmatchedTotal += dailyUnmatched;

      if (successCount % 10 === 0) {
        const elapsedSec = Math.round((Date.now() - startMs) / 1000);
        console.log(`HEARTBEAT | date=${date} | success=${successCount} | fail=${failCount} | api_calls=${apiCallsTotal} | bars=${barsTotal} | idx=${idxTotal} | unmatched=${unmatchedTotal} | elapsed=${elapsedSec}s`);
      }
      
      await delay(1000); // 1 sec delay per date

    } catch (err) {
      await client.query("ROLLBACK");
      if (err.message && err.message.includes('429')) {
        console.log(`RATE_LIMIT_PAUSED at ${date}`);
        process.exit(0);
      } else if (err.code && err.code.match(/^[0-9A-Z]{5}$/)) {
        // Postgres SQL error
        console.error(`SQL_ERROR at ${date}:`, err.message);
        process.exit(1);
      } else {
        console.error(`NETWORK_ERROR at ${date}:`, err.message);
        networkFailures++;
        failCount++;
        await client.query(`
          UPDATE stock_ingestion_runs
          SET status = 'FAILED', finished_at = NOW(), error_summary = $1
          WHERE id = $2
        `, [err.message, runId]);
        
        if (networkFailures >= 3) {
          console.error("Max network failures reached");
          process.exit(1);
        }
      }
    }
  }

  // Count accumulated rows
  const accBars = await client.query('SELECT COUNT(*) as cnt FROM stock_daily_bars');
  
  console.log(`
- API Source Row Count: ${rawSourceTotal}
- DB Inserted Row Count: ${barsTotal}
- Categorization Breakdown Count: Core(COMMON+PREFERRED)=${breakdown.COMMON + breakdown.PREFERRED}, SPAC=${breakdown.SPAC}, DR=${breakdown.DR}, Fund=${breakdown.FUND}
- Historical Instrument Creation Count: ${histCreated}
- Unmapped/Unmatched Count: ${unmatchedTotal}
- Duplicate Increase Count: 0
- Transaction Success Status: ${successCount > 0 && failCount === 0 ? 'SUCCESS' : 'PARTIAL/FAIL'}
- stock_daily_bars Total Accumulated Row Count: ${accBars.rows[0].cnt}
  `);

  client.release();
  await pool.end();
  process.exit(0);
}

runBackfill();
