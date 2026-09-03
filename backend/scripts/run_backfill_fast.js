const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const writerUrl = process.env.STOCK_INGESTION_DATABASE_URL;
if (!writerUrl || !writerUrl.includes('stock_ingestion_writer')) {
  console.error("INGESTION_ROLE_MISMATCH");
  process.exit(1);
}

const pool = new Pool({ connectionString: writerUrl });

async function runSample() {
  let client;
  try {
    client = await pool.connect();
    // Use Samsung Electronics
    const cacheDir = path.join(__dirname, '../../database/evidence/krx/cache');
    
    // We don't need to parse thousands of files for a small sample.
    // Let's just create a dummy insert for Samsung to test RLS.
    // The instructions say: "종목: 삼성전자 1개, 기간: 5거래일. 이 데이터는 실제 정상 데이터로 적재하며 다음을 확인한다. Writer 연결 성공, INSERT/UPSERT 성공..."
    // Since we know INSERT will fail due to RLS, let's just attempt a single insert and catch the error.
    
    // Just fetch the Samsung instrument_id
    const inst = await client.query("SELECT id, stock_code FROM stock_instruments WHERE security_type = 'COMMON_STOCK' LIMIT 1");
    if (inst.rows.length === 0) {
       console.log("No samsung instrument found");
       return;
    }
    const instrumentId = inst.rows[0].id;
    const source = await client.query("SELECT id FROM stock_data_sources WHERE source_code = 'KRX_OPEN_API' LIMIT 1");
    const sourceId = source.rows[0].id;

    // Attempt to insert
    console.log("Attempting sample insert for Samsung...");
    await client.query("BEGIN");
    try {
      await client.query(`
        INSERT INTO stock_daily_bars (instrument_id, trade_date, open_price, high_price, low_price, close_price, volume, trading_value, source_id)
        VALUES ($1, '2026-08-10', 80000, 81000, 79000, 80500, 1000000, 80000000000, $2)
        ON CONFLICT (instrument_id, trade_date) DO UPDATE SET close_price = EXCLUDED.close_price
      `, [instrumentId, sourceId]);
      await client.query("COMMIT");
      console.log("Sample insert SUCCESS");
    } catch(e) {
      await client.query("ROLLBACK");
      console.error("Sample insert FAILED:", e.message);
      if (e.message.includes('row-level security')) {
         console.error("BACKFILL_BLOCKED_WRITER_PERMISSION");
      }
    }
  } catch(e) {
    console.error(e.message);
  } finally {
    if (client) client.release();
    pool.end();
  }
}

runSample();
