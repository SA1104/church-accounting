const { KrxOpenApiProvider } = require('./backend/service/stock/providers/KrxOpenApiProvider');
require('dotenv').config({path: 'backend/.env.development'});
const fs = require('fs');
const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const p = new KrxOpenApiProvider();

  // Load Master API
  const kospiRaw = JSON.parse(fs.readFileSync('database/evidence/krx/2026-08-18/krx_kospi_raw.json', 'utf8')).OutBlock_1 || [];
  const kosdaqRaw = JSON.parse(fs.readFileSync('database/evidence/krx/2026-08-18/krx_kosdaq_raw.json', 'utf8')).OutBlock_1 || [];
  
  const kospiMaster = p.normalizeInstrumentResponse(kospiRaw, {}, 'KOSPI');
  const kosdaqMaster = p.normalizeInstrumentResponse(kosdaqRaw, {}, 'KOSDAQ');
  
  const acceptedInsts = [...(kospiMaster.records||[]), ...(kosdaqMaster.records||[])];
  
  const stockClient = await pool.connect();
  try {
    await stockClient.query('BEGIN');
    
    // Insert Instruments
    for (const inst of acceptedInsts) {
      await stockClient.query(`
        INSERT INTO stock_instruments (stock_code, instrument_name, primary_market_code, security_type, currency_code, listing_date, listing_status, is_active, source_id)
        VALUES ($1, $2, $3, $4, 'KRW', $5, 'LISTED', true, (SELECT id FROM stock_data_sources WHERE source_code='KRX_OPEN_API'))
        ON CONFLICT (stock_code, primary_market_code) DO UPDATE 
        SET instrument_name=EXCLUDED.instrument_name, security_type=EXCLUDED.security_type, listing_date=EXCLUDED.listing_date
      `, [inst.stock_code, inst.instrument_name, inst.primary_market_code, inst.security_type, inst.listing_date]);
    }
    
    await stockClient.query('COMMIT');
    console.log(`Inserted/Updated ${acceptedInsts.length} instruments into stock_instruments`);
  } catch (e) {
    await stockClient.query('ROLLBACK');
    console.error('DB Insert failed:', e);
  } finally {
    stockClient.release();
    pool.end();
  }
}
run();
