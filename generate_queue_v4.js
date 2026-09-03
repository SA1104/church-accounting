const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env.development' });

async function run() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const db = await c.query('SELECT stock_code, instrument_name, primary_market_code FROM stock_instruments');

  const reconCsv = fs.readFileSync('database/verification/source_reconciliation_v4.csv', 'utf8').split('\n').slice(1);
  const includedCodes = new Set();
  reconCsv.forEach(l => {
    if (l) {
      const parts = l.split(',');
      if (parts[7] === 'TRUE') {
        includedCodes.add(parts[3]);
      }
    }
  });

  const queueCsv = ['stock_code,instrument_name,previous_market_code,previous_listing_date,current_api_present,listing_status,delisting_date,evidence_type,evidence_date,evidence_reference,evidence_hash,verification_result,review_note'];
  
  const listingDates = JSON.parse(fs.readFileSync('listing_dates.json', 'utf8'));

  let count = 0;
  for (const row of db.rows) {
    if (!includedCodes.has(row.stock_code)) {
      count++;
      const lddRaw = listingDates[row.stock_code] || '';
      const listNorm = lddRaw ? `${lddRaw.substring(0,4)}-${lddRaw.substring(4,6)}-${lddRaw.substring(6,8)}` : '';
      queueCsv.push(`${row.stock_code},${row.instrument_name},${row.primary_market_code},${listNorm},FALSE,LISTED,,NONE,,,,,MISSING_FROM_CURRENT_SOURCE|DELISTING_UNVERIFIED|NOT_INCLUDED_IN_V4_PAYLOAD`);
    }
  }

  fs.writeFileSync('database/verification/lifecycle_review_queue_v4.csv', queueCsv.join('\n'));

  const diffTxt = `previous_242: 242\ncurrent_196: ${count}\nremoved_46: 46\nnewly_added: 0\nreason: The previous 242 count was a calculation error adding 46 items that were missing in both 2024 and 2026 to the 196 items missing only in 2026, effectively double counting them. The true missing count from the 2558 snapshot compared to the 2026 current source is ${count}.`;
  fs.writeFileSync('database/verification/delisted_difference.txt', diffTxt);
  
  console.log('Queue generated with', count, 'items.');
  await c.end();
}
run();
