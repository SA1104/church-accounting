const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

async function backupInstruments() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM stock_instruments ORDER BY id');
    
    if (res.rows.length === 0) {
      console.log('No instruments found to backup.');
      return;
    }

    const headers = Object.keys(res.rows[0]);
    let csv = headers.join(',') + '\n';
    
    for (const row of res.rows) {
      const values = headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csv += values.join(',') + '\n';
    }

    const backupDir = path.join(__dirname, '../../database/verification');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupPath = path.join(backupDir, 'instrument_backup_20260818.csv');
    fs.writeFileSync(backupPath, csv);
    console.log(`Backed up ${res.rows.length} instruments to ${backupPath}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

backupInstruments();
