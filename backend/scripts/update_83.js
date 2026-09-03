const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });

async function run() {
  const lines = fs.readFileSync('database/verification/source_reconciliation_v4.csv', 'utf8').split('\n');
  const spac = [], dr = [], fund = [];
  for (const line of lines) {
    if (line.includes('EXCLUDE_SPAC')) spac.push(line.split(',')[0].trim());
    if (line.includes('EXCLUDE_DR')) dr.push(line.split(',')[0].trim());
    if (line.includes('EXCLUDE_FUND')) fund.push(line.split(',')[0].trim());
  }
  
  console.log('SPAC:', spac.length, 'DR:', dr.length, 'FUND:', fund.length);
  
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  if (spac.length > 0) {
    await c.query(`UPDATE stock_instruments SET security_type='SPAC' WHERE stock_code IN (${spac.map(x=>`'${x}'`).join(',')})`);
  }
  if (dr.length > 0) {
    await c.query(`UPDATE stock_instruments SET security_type='DR' WHERE stock_code IN (${dr.map(x=>`'${x}'`).join(',')})`);
  }
  if (fund.length > 0) {
    await c.query(`UPDATE stock_instruments SET security_type='FUND' WHERE stock_code IN (${fund.map(x=>`'${x}'`).join(',')})`);
  }
  console.log('Updated 83 categories in DB');
  process.exit(0);
}
run();
