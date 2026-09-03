const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  
  console.log('--- 1. Verification Continued ---');
  // 미매핑 0건 (instrument_id가 NULL인 경우)
  const unmapped = await client.query(`SELECT COUNT(*) FROM stock_daily_bars WHERE instrument_id IS NULL`);
  console.log('미매핑(NULL instrument_id) 0건 검증:', unmapped.rows[0].count == 0 ? '통과' : '실패');
  
  // NULL 종목 연결 0건 (실제 존재하지 않는 instrument_id)
  const noMatch = await client.query(`
    SELECT COUNT(*) 
    FROM stock_daily_bars b 
    LEFT JOIN stock_instruments i ON b.instrument_id = i.id 
    WHERE i.id IS NULL
  `);
  console.log('존재하지 않는 종목 연결 0건 검증:', noMatch.rows[0].count == 0 ? '통과' : '실패');
  
  // OHLC 무결성 위반 0건 (high < low, 등등)
  const ohlc = await client.query(`
    SELECT COUNT(*) 
    FROM stock_daily_bars 
    WHERE high_price < low_price 
       OR close_price > high_price 
       OR close_price < low_price 
       OR open_price > high_price 
       OR open_price < low_price
  `);
  console.log('OHLC 무결성 위반 0건 검증:', ohlc.rows[0].count == 0 ? '통과' : '실패');
  
  // 음수 거래량·거래대금 0건
  const negVol = await client.query(`SELECT COUNT(*) FROM stock_daily_bars WHERE accumulated_trading_volume < 0 OR accumulated_trading_value < 0`);
  console.log('음수 거래량·거래대금 0건 검증:', negVol.rows[0].count == 0 ? '통과' : '실패');
  
  // SUCCESS/FAILED/RUNNING 실행 수
  const runs = await client.query(`SELECT status, COUNT(*) FROM stock_ingestion_runs GROUP BY status`);
  console.log('실행 상태별 횟수:');
  runs.rows.forEach(r => console.log(`  ${r.status}: ${r.count}`));
  
  // 최종 Checkpoint
  const chk = await client.query(`SELECT checkpoint_date FROM stock_ingestion_runs ORDER BY started_at DESC LIMIT 1`);
  console.log('최종 Checkpoint:', chk.rows[0] ? chk.rows[0].checkpoint_date : '없음');
  
  // KOSPI/KOSDAQ 지수 테이블 총 행 수
  const idxCount = await client.query(`SELECT COUNT(*) FROM stock_index_daily_bars`);
  console.log('stock_index_daily_bars 총 행 수:', idxCount.rows[0].count);
  
  // 지수별 MIN/MAX 날짜
  const idxMinMax = await client.query(`
    SELECT index_code, MIN(trade_date), MAX(trade_date) 
    FROM stock_index_daily_bars 
    GROUP BY index_code
  `);
  console.log('지수별 MIN/MAX 날짜:');
  idxMinMax.rows.forEach(r => console.log(`  ${r.index_code}: ${r.min} ~ ${r.max}`));
  
  console.log('\\n--- 2. DB 실제 용량 확인 ---');
  const dbSize = await client.query(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`);
  console.log('현재 DB 총 크기:', dbSize.rows[0].size);
  
  const tables = await client.query(`
    SELECT
      relname,
      pg_size_pretty(pg_relation_size(relid)) AS table_size,
      pg_size_pretty(pg_indexes_size(relid)) AS index_size,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size
    FROM pg_catalog.pg_statio_user_tables
    WHERE relname LIKE 'stock_%'
    ORDER BY pg_total_relation_size(relid) DESC
  `);
  console.log('테이블별 용량:');
  tables.rows.forEach(r => {
    console.log(`  ${r.relname}: Table ${r.table_size}, Index ${r.index_size}, Total ${r.total_size}`);
  });
  
  client.release();
  pool.end();
}
run().catch(console.error);
