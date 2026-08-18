const assert = require('assert');
const StockRepository = require('../../service/stock/repositories/StockRepository');

async function runTests() {
  let queries = [];
  const mockDb = {
    query: async (sql, params) => {
      queries.push({ sql, params });
      if (sql.includes('stock_data_sources')) return { rows: [{id: 1}] };
      return { rowCount: params.length > 0 ? 1 : 0 };
    }
  };

  const repo = new StockRepository(mockDb);
  process.env.ALLOW_STOCK_DATA_WRITE = 'YES_DEV_ONLY';

  console.log('Testing 2+ Batch Upsert & Parameter Binding...');
  const records = [
    { stock_code: '000001', instrument_name: 'Test1', primary_market_code: 'KRX_KOSPI', security_type: 'COMMON' },
    { stock_code: '000002', instrument_name: 'Test2', primary_market_code: 'KRX_KOSDAQ', security_type: 'PREFERRED' }
  ];
  
  await repo.upsertInstruments(records);
  
  const insertQuery = queries.find(q => q.sql.includes('INSERT INTO stock_instruments'));
  
  assert(insertQuery.params.includes('000001') && insertQuery.params.includes('000002'), 'Values not passed correctly');
  assert(insertQuery.params.includes('PREFERRED'), 'Security type mapping not preserved');
  assert(!insertQuery.sql.includes('exec_sql'), 'exec_sql should not be used');
  
  console.log('Testing Write protection...');
  process.env.ALLOW_STOCK_DATA_WRITE = 'NO';
  try {
    await repo.upsertInstruments(records);
    assert.fail('Write should have been blocked');
  } catch(e) {
    assert(e.message.includes('STOCK_WRITE_FORBIDDEN'));
  }
  process.env.ALLOW_STOCK_DATA_WRITE = 'YES_DEV_ONLY';
  
  console.log('StockRepository Tests Passed.');
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
