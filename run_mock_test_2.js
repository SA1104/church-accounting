require('dotenv').config({ path: 'backend/.env.development' });
const { Client } = require('pg');
const { KrxOpenApiProvider } = require('./backend/service/stock/providers/KrxOpenApiProvider');
const StockRepository = require('./backend/service/stock/repositories/StockRepository');

async function runMockTest() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const repo = new StockRepository(client);
  const provider = new KrxOpenApiProvider();

  console.log('--- RUNNING MOCK TESTS ---');

  const rawData = [
    { ISU_SRT_CD: '005930', ISU_ABBRV: '?¼ì„±?„ìž', LIST_DD: '19750611', SECUGRP_NM: 'ì£¼ê¶Œ' },
    { ISU_SRT_CD: '005935', ISU_ABBRV: '?¼ì„±?„ìž??, LIST_DD: '19750611', KIND_STKCERT_TP_NM: '?°ì„ ì£? },
    { ISU_SRT_CD: '999999', ISU_ABBRV: '?˜ëª»?œë‚ ì§?, LIST_DD: '20261399' }
  ];
  
  const normalized = provider.normalizeInstrumentResponse(rawData, { asOfAt: new Date().toISOString() }, 'KOSPI');
  
  console.log(`Accepted: ${normalized.records.length}, Rejected: ${normalized.rejected.length}`);
  
  const s5930 = normalized.records.find(r => r.stock_code === '005930');
  const s5935 = normalized.records.find(r => r.stock_code === '005935');
  const badDate = normalized.rejected.find(r => r.raw.ISU_SRT_CD === '999999');

  if (s5930.listing_date !== '1975-06-11') throw new Error('Invalid listing_date parsing');
  if (s5930.security_type !== 'COMMON') throw new Error('Samsung should be COMMON');
  if (s5935.security_type !== 'PREFERRED') throw new Error('Samsung Pref should be PREFERRED');
  if (!badDate || badDate.reason !== 'Invalid listing_date format') throw new Error('Invalid date not rejected');

  console.log('Mock Provider logic OK');

  await client.query('BEGIN');
  await repo.upsertInstruments(normalized.records);
  
  const insts = await client.query(`SELECT * FROM stock_instruments WHERE stock_code IN ('005930', '005935') AND primary_market_code = 'KRX_KOSPI'`);
  const venues = await client.query(`
    SELECT v.* FROM stock_instrument_venues v 
    JOIN stock_instruments i ON v.instrument_id = i.id 
    WHERE i.stock_code IN ('005930', '005935')
  `);
  
  const inst = insts.rows.find(r => r.stock_code === '005930');
  console.log('listing_date DB value:', inst.listing_date);
  if (!inst.listing_date) throw new Error('listing_date is null');
  if (venues.rows.length !== 2) throw new Error('Venues not created exactly 1 per instrument');

  console.log('Mock Repository Upsert OK');

  s5930.listing_date = '1975-06-12'; 
  await repo.upsertInstruments([s5930]);
  
  const insts2 = await client.query(`SELECT * FROM stock_instruments WHERE stock_code = '005930' AND primary_market_code = 'KRX_KOSPI'`);
  const venues2 = await client.query(`
    SELECT v.* FROM stock_instrument_venues v 
    JOIN stock_instruments i ON v.instrument_id = i.id 
    WHERE i.stock_code = '005930'
  `);
  
  
  if (venues2.rows.length !== 1) throw new Error('Venue duplicated or lost on update');
  
  console.log('Mock Repository Update OK');
  
  await client.query('ROLLBACK');
  await client.end();
  console.log('--- MOCK TESTS PASSED ---');
}

runMockTest().catch(e => { console.error(e); process.exit(1); });
