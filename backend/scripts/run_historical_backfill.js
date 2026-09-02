const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const { Pool } = require('pg');
const { KrxOpenApiProvider } = require('../service/stock/providers/KrxOpenApiProvider');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const provider = new KrxOpenApiProvider();

async function getDatesToProcess(client) {
  let current = new Date('2026-07-01');
  const end = new Date('2026-08-31');
  const dates = [];
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      dates.push(`${yyyy}${mm}${dd}`);
    }
    current.setDate(current.getDate() + 1);
  }

  const { rows } = await client.query(`
    SELECT target_date FROM stock_ingestion_runs 
    WHERE status = 'SUCCESS' AND target_date IS NOT NULL
  `);
  
  const processedSet = new Set(rows.map(r => {
    const d = new Date(r.target_date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }));

  return dates.filter(d => !processedSet.has(d));
}

async function run() {
  const client = await pool.connect();
  const dates = await getDatesToProcess(client);
  console.log(`Starting backfill for ${dates.length} days...`);

  for (const date of dates) {
    console.log(`Processing ${date}...`);
    try {
      await client.query('BEGIN');
      const targetDateStr = `${date.substring(0,4)}-${date.substring(4,6)}-${date.substring(6,8)}`;
      const runIdRes = await client.query(`
        INSERT INTO stock_ingestion_runs (id, job_code, target_date, status, provider_code) 
        VALUES (gen_random_uuid(), 'HISTORICAL_BACKFILL', $1, 'RUNNING', 'KRX_OPEN_API') RETURNING id
      `, [targetDateStr]);
      const runId = runIdRes.rows[0].id;

      // KOSPI/KOSDAQ Daily
      const kospiData = await provider.fetchDailyBars({ market: 'KOSPI', date });
      const kosdaqData = await provider.fetchDailyBars({ market: 'KOSDAQ', date });
      const dailyBars = [...(kospiData.records||[]), ...(kosdaqData.records||[])];

      if (dailyBars.length > 0) {
        let inserted = 0;
        const batchSize = 1000;
        for (let i = 0; i < dailyBars.length; i += batchSize) {
          const batch = dailyBars.slice(i, i + batchSize);
          const values = [];
          for (const b of batch) {
             let cleanDt = (b.tradeDate || date).replace(/[^0-9]/g, '');
             let tradeDateStr = `${cleanDt.substring(0,4)}-${cleanDt.substring(4,6)}-${cleanDt.substring(6,8)}`;
             const op = b.openPrice === 'undefined' ? 0 : (b.openPrice || 0);
             const hp = b.highPrice === 'undefined' ? 0 : (b.highPrice || 0);
             const lp = b.lowPrice === 'undefined' ? 0 : (b.lowPrice || 0);
             const cp = b.closePrice === 'undefined' ? 0 : (b.closePrice || 0);
             const vol = b.volume === 'undefined' ? 0 : (b.volume || 0);
             const amt = b.tradingValue === 'undefined' ? 0 : (b.tradingValue || 0);
             values.push(`((SELECT id FROM stock_instruments WHERE primary_market_code='${b.marketCode}' AND stock_code='${b.stockCode}'), '${tradeDateStr}'::date, ${op}, ${hp}, ${lp}, ${cp}, ${vol}, ${amt}, (SELECT id FROM stock_data_sources WHERE source_code='KRX_OPEN_API'))`);
          }
          
          if (batch.length > 0) {
             await client.query(`
               INSERT INTO stock_daily_bars (instrument_id, trade_date, open_price, high_price, low_price, close_price, volume, trading_value, source_id)
               SELECT * FROM (VALUES ${values.join(',')}) as t(instrument_id, trade_date, open_price, high_price, low_price, close_price, volume, trading_value, source_id)
               WHERE instrument_id IS NOT NULL
               ON CONFLICT (instrument_id, trade_date) DO NOTHING
             `);
          }
        }
      }

      // KOSPI/KOSDAQ Index
      const kospiIdxData = await provider.fetchIndexDailyBars({ market: 'KOSPI', date });
      const kosdaqIdxData = await provider.fetchIndexDailyBars({ market: 'KOSDAQ', date });
      const idxBars = [...(kospiIdxData.records||[]), ...(kosdaqIdxData.records||[])];

      if (idxBars.length > 0) {
        for (const b of idxBars) {
          let mkt = b.marketCode;
          if (mkt === 'KOSPI' && b.stockCode === '001') mkt = 'KRX_KOSPI';
          else if (mkt === 'KOSDAQ' && b.stockCode === '001') mkt = 'KRX_KOSDAQ';
          else continue;

          const op = b.openValue === 'undefined' ? 0 : (b.openValue || 0);
          const hp = b.highValue === 'undefined' ? 0 : (b.highValue || 0);
          const lp = b.lowValue === 'undefined' ? 0 : (b.lowValue || 0);
          const cp = b.closeValue === 'undefined' ? 0 : (b.closeValue || 0);
          const vol = b.volume === 'undefined' ? 0 : (b.volume || 0);
          const amt = b.tradingValue === 'undefined' ? 0 : (b.tradingValue || 0);
          
          let cleanDt = (b.tradeDate || date).replace(/[^0-9]/g, '');
          let tradeDateStr = `${cleanDt.substring(0,4)}-${cleanDt.substring(4,6)}-${cleanDt.substring(6,8)}`;

          await client.query(`
            INSERT INTO stock_index_daily_bars (index_id, trade_date, open_price, high_price, low_price, close_price, volume, trading_value, source_id)
            SELECT (SELECT id FROM stock_indices WHERE index_code='${mkt}_IDX'), '${tradeDateStr}'::date, ${op}, ${hp}, ${lp}, ${cp}, ${vol}, ${amt}, (SELECT id FROM stock_data_sources WHERE source_code='KRX_OPEN_API')
            WHERE (SELECT id FROM stock_indices WHERE index_code='${mkt}_IDX') IS NOT NULL
            ON CONFLICT (index_id, trade_date) DO UPDATE SET
            close_price = EXCLUDED.close_price
          `);
        }
      }

      await client.query(`UPDATE stock_ingestion_runs SET status = 'SUCCESS', finished_at = NOW() WHERE id = $1`, [runId]);
      await client.query('COMMIT');
      console.log(`Successfully processed ${date}`);
      
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(`Error on ${date}:`, e.message);
      if (e.message.includes('429')) {
        console.log('Rate limit hit! Stopping backfill. Run this script again tomorrow.');
        process.exit(0);
      }
    }
  }

  client.release();
  pool.end();
}

run().catch(console.error);
