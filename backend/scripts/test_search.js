const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const StockReadRepository = require('../service/stock/repositories/StockReadRepository');

async function test() {
  const repo = new StockReadRepository();
  const results = await repo.searchInstruments({ q: '삼성전자', limit: 1 });
  console.log(JSON.stringify(results, null, 2));
}

test().catch(console.error);
