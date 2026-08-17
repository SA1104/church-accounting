const assert = require('assert');
const { StockPostgresAdapter } = require('../../service/stock/repositories/StockPostgresAdapter');

async function runTests() {
  console.log('--- Testing Stock DB Adapter ---');
  let adapter = new StockPostgresAdapter(null);
  try { await adapter.get('SELECT 1'); assert.fail('Should throw DB_NOT_CONFIGURED'); } 
  catch (e) { assert(e.code === 'DB_NOT_CONFIGURED', 'Expected DB_NOT_CONFIGURED'); }

  const dummyPool = { query: async () => ({ rows: [{ has_instruments: 1 }] }) };
  adapter = new StockPostgresAdapter(dummyPool);
  const result = await adapter.get('SELECT ?', [1]);
  assert(result.has_instruments === 1, 'Should bind correctly and return result');
  console.log('Stock Adapter tests passed.');
}

runTests().catch(e => { console.error(e); process.exit(1); });
