const { Pool } = require('pg');
const writerUrl = "postgresql://stock_ingestion_writer.zuclqyxfovktmhfzzuji:writer_pass@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";
const p = new Pool({ connectionString: writerUrl });

async function test() {
  try {
    const r = await p.query("INSERT INTO stock_daily_bars (instrument_id, trade_date, open_price, high_price, low_price, close_price, volume, trading_value, source_id) VALUES ((SELECT id FROM stock_instruments LIMIT 1), '2026-01-01', 1, 1, 1, 1, 1, 1, (SELECT id FROM stock_data_sources LIMIT 1)) ON CONFLICT DO NOTHING RETURNING *");
    console.log("INSERT success", r.rowCount);
  } catch(e) {
    console.error("INSERT failed:", e.message);
  } finally {
    p.end();
  }
}
test();
