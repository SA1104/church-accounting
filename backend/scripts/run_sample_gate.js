const { Pool } = require('pg');
const { KrxOpenApiProvider } = require('../service/stock/providers/KrxOpenApiProvider');
require('dotenv').config({path: 'backend/.env.development'});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const provider = new KrxOpenApiProvider();

async function runSampleGate() {
  console.log('--- Sample Gate: 2026-08-14 ---');
  const results = {};
  
  // 1. KOSPI Daily
  console.log('1. KOSPI Daily API...');
  const kospiData = await provider.fetchDailyBars({ market: 'KOSPI', date: '20260814' });
  results.kospi = kospiData;
  
  // 2. KOSDAQ Daily
  console.log('2. KOSDAQ Daily API...');
  const kosdaqData = await provider.fetchDailyBars({ market: 'KOSDAQ', date: '20260814' });
  results.kosdaq = kosdaqData;

  // 3. KOSPI Index
  console.log('3. KOSPI Index API...');
  const kospiIdxData = await provider.fetchIndexDailyBars({ market: 'KOSPI', date: '20260814' });
  results.kospiIdx = kospiIdxData;

  // 4. KOSDAQ Index
  console.log('4. KOSDAQ Index API...');
  const kosdaqIdxData = await provider.fetchIndexDailyBars({ market: 'KOSDAQ', date: '20260814' });
  results.kosdaqIdx = kosdaqIdxData;

  const stockClient = await pool.connect();
  let runId = null;
  try {
    await stockClient.query('BEGIN');
    
    const runId = require('crypto').randomUUID();
    const insertRun = await stockClient.query(`
      INSERT INTO stock_ingestion_runs (id, provider_code, job_code, target_date, status, started_at)
      VALUES ($1, 'KRX_OPEN_API', 'DAILY_BARS', '2026-08-14', 'RUNNING', NOW()) RETURNING id
    `, [runId]);

    let dailyUpserts = 0;
    let indexUpserts = 0;

    // UPSERT stock_daily_bars
    const insertDailyBar = `
      INSERT INTO stock_daily_bars (instrument_id, trade_date, open_price, high_price, low_price, close_price, change_amount, change_rate, volume, trading_value, market_cap, listed_shares, source_id, created_at)
      SELECT i.id, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, (SELECT id FROM stock_data_sources WHERE source_code='KRX_OPEN_API'), NOW()
      FROM stock_instruments i WHERE i.stock_code = $12 AND i.primary_market_code = $13
      ON CONFLICT (instrument_id, trade_date) DO UPDATE SET
        open_price = EXCLUDED.open_price,
        high_price = EXCLUDED.high_price,
        low_price = EXCLUDED.low_price,
        close_price = EXCLUDED.close_price,
        change_amount = EXCLUDED.change_amount,
        change_rate = EXCLUDED.change_rate,
        volume = EXCLUDED.volume,
        trading_value = EXCLUDED.trading_value,
        market_cap = EXCLUDED.market_cap,
        listed_shares = EXCLUDED.listed_shares
    `;

    for (const d of (kospiData.records || [])) {
      if (!d.tradeDate) continue;
      const res = await stockClient.query(insertDailyBar, [d.tradeDate, d.openPrice, d.highPrice, d.lowPrice, d.closePrice, d.changeAmount, d.changeRate, d.volume, d.tradingValue, d.marketCap, d.listedShares, d.stockCode, 'KRX_KOSPI']);
      dailyUpserts += res.rowCount;
    }
    for (const d of (kosdaqData.records || [])) {
      if (!d.tradeDate) continue;
      const res = await stockClient.query(insertDailyBar, [d.tradeDate, d.openPrice, d.highPrice, d.lowPrice, d.closePrice, d.changeAmount, d.changeRate, d.volume, d.tradingValue, d.marketCap, d.listedShares, d.stockCode, 'KRX_KOSDAQ']);
      dailyUpserts += res.rowCount;
    }

    // UPSERT stock_index_daily_bars
    const insertIndexBar = `
      INSERT INTO stock_index_daily_bars (index_code, trade_date, open_value, high_value, low_value, close_value, volume, change_amount, change_rate, source_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, (SELECT id FROM stock_data_sources WHERE source_code='KRX_OPEN_API'), NOW(), NOW())
      ON CONFLICT (index_code, trade_date) DO UPDATE SET
        open_value = EXCLUDED.open_value,
        high_value = EXCLUDED.high_value,
        low_value = EXCLUDED.low_value,
        close_value = EXCLUDED.close_value,
        volume = EXCLUDED.volume,
        change_amount = EXCLUDED.change_amount,
        change_rate = EXCLUDED.change_rate,
        updated_at = NOW()
    `;

    for (const d of (kospiIdxData.records || [])) {
      if (!d.tradeDate) continue;
      const res = await stockClient.query(insertIndexBar, [d.indexCode, d.tradeDate, d.openValue, d.highValue, d.lowValue, d.closeValue, d.volume, d.changeValue, d.changeRate]);
      indexUpserts += res.rowCount;
    }
    for (const d of (kosdaqIdxData.records || [])) {
      if (!d.tradeDate) continue;
      const res = await stockClient.query(insertIndexBar, [d.indexCode, d.tradeDate, d.openValue, d.highValue, d.lowValue, d.closeValue, d.volume, d.changeValue, d.changeRate]);
      indexUpserts += res.rowCount;
    }

    await stockClient.query(`
      UPDATE stock_ingestion_runs SET status='SUCCESS', inserted_count=$1, finished_at=NOW() WHERE id=$2
    `, [dailyUpserts + indexUpserts, runId]);

    await stockClient.query('COMMIT');
    console.log('Upsert committed.');

    // Validations
    console.log('\n--- Validations ---');
    console.log(`API KOSPI Records: ${kospiData.records?.length || 0}`);
    console.log(`API KOSDAQ Records: ${kosdaqData.records?.length || 0}`);
    console.log(`API KOSPI Index Records: ${kospiIdxData.records?.length || 0} (Warnings: ${kospiIdxData.warnings.join(', ')})`);
    console.log(`API KOSDAQ Index Records: ${kosdaqIdxData.records?.length || 0} (Warnings: ${kosdaqIdxData.warnings.join(', ')})`);
    
    console.log(`DB Daily Upserts: ${dailyUpserts}, Index Upserts: ${indexUpserts}`);

    const s = await pool.query(`SELECT i.stock_code, i.instrument_name, d.open_price, d.close_price, d.volume, d.trading_value 
                                FROM stock_daily_bars d 
                                JOIN stock_instruments i ON d.instrument_id = i.id 
                                WHERE i.stock_code IN ('005930', '005935') AND d.trade_date='2026-08-14'`);
    console.log('Samsung:', s.rows);

    const idx = await pool.query(`SELECT index_code, close_value, volume, change_rate FROM stock_index_daily_bars WHERE trade_date='2026-08-14'`);
    console.log('Indices:', idx.rows);

  } catch(e) {
    await stockClient.query('ROLLBACK');
    console.error('Error during DB ops', e);
  } finally {
    stockClient.release();
    pool.end();
  }
}
runSampleGate();
