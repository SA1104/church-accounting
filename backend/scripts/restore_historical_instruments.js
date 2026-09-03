const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

async function restoreInstruments() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    
    const csvPath = path.join(__dirname, '../../database/verification/lifecycle_review_queue_v4.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    
    const dataLines = lines.slice(1);
    
    let inserted = 0;
    let updated = 0;

    for (const line of dataLines) {
      const parts = line.split(',');
      if (parts.length < 3) continue;
      
      const stockCode = parts[0].trim();
      const instrumentName = parts[1].trim();
      const marketCode = parts[2].trim();
      let listingDate = parts[3] ? parts[3].trim() : null;
      if (!listingDate || listingDate === '') listingDate = null;

      let securityType = 'COMMON';
      if (instrumentName.includes('스팩')) {
        securityType = 'SPAC';
      } else if (instrumentName.endsWith('우') || instrumentName.endsWith('우B') || instrumentName.endsWith('우(전환)')) {
        securityType = 'PREFERRED';
      }

      const query = `
        INSERT INTO stock_instruments (
          stock_code, primary_market_code, instrument_name, security_type, 
          listing_date, is_active, listing_status, currency_code, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, false, 'REVIEW_PENDING', 'KRW', NOW()
        )
        ON CONFLICT (stock_code, primary_market_code) DO UPDATE SET
          is_active = false,
          listing_status = 'REVIEW_PENDING',
          updated_at = NOW()
        RETURNING (xmax = 0) AS is_insert
      `;
      
      const values = [stockCode, marketCode, instrumentName, securityType, listingDate];
      const res = await client.query(query, values);
      
      if (res.rows[0].is_insert) inserted++;
      else updated++;
    }
    
    console.log(`Restoration complete. Inserted: ${inserted}, Updated: ${updated}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

restoreInstruments();
