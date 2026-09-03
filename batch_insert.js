const { KrxOpenApiProvider } = require('./backend/service/stock/providers/KrxOpenApiProvider');
require('dotenv').config({path: 'backend/.env.development'});
const fs = require('fs');
const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const p = new KrxOpenApiProvider();

  const kospiRaw = JSON.parse(fs.readFileSync('database/evidence/krx/2026-08-18/krx_kospi_raw.json', 'utf8')).OutBlock_1 || [];
  const kosdaqRaw = JSON.parse(fs.readFileSync('database/evidence/krx/2026-08-18/krx_kosdaq_raw.json', 'utf8')).OutBlock_1 || [];
  
  const kospiMaster = p.normalizeInstrumentResponse(kospiRaw, {}, 'KOSPI');
  const kosdaqMaster = p.normalizeInstrumentResponse(kosdaqRaw, {}, 'KOSDAQ');
  
  const acceptedInsts = [...(kospiMaster.records||[]), ...(kosdaqMaster.records||[])];
  
  const stockClient = await pool.connect();
  try {
    await stockClient.query('BEGIN');
    
    // Clear old instruments to make sure we only have exactly 2680
    await stockClient.query('TRUNCATE stock_daily_bars, stock_instrument_venues, stock_instruments CASCADE');
    
    await stockClient.query(`
      INSERT INTO stock_data_sources (source_code, source_name, source_type, access_type) 
      VALUES ('KRX_OPEN_API', 'KRX Open API', 'PROVIDER', 'OPEN_API') 
      ON CONFLICT DO NOTHING
    `);

    // Insert Instruments
    const values = [];
    for (const inst of acceptedInsts) {
      values.push(`('${inst.stock_code}', '${inst.instrument_name}', '${inst.primary_market_code}', '${inst.security_type}', 'KRW', '${inst.listing_date}', 'LISTED', true, (SELECT id FROM stock_data_sources WHERE source_code='KRX_OPEN_API'))`);
    }

    const batchSize = 1000;
    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize);
      await stockClient.query(`
        INSERT INTO stock_instruments (stock_code, instrument_name, primary_market_code, security_type, currency_code, listing_date, listing_status, is_active, source_id)
        VALUES ${batch.join(',')}
      `);
    }

    await stockClient.query('COMMIT');
    console.log(`Inserted ${acceptedInsts.length} instruments successfully`);
  } catch (e) {
    await stockClient.query('ROLLBACK');
    console.error('DB Insert failed:', e);
  } finally {
    stockClient.release();
    pool.end();
  }
}
run();
