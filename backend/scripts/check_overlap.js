const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: 'backend/.env.development' });
const c = new Client({ connectionString: process.env.DATABASE_URL });

c.connect().then(async () => {
  const csv = fs.readFileSync('database/verification/lifecycle_review_queue_v4.csv', 'utf8');
  const lines = csv.split('\n').slice(1).filter(l => l.trim() !== '');
  const queueCodes = lines.map(l => l.split(',')[0].trim());
  
  const backup = fs.readFileSync('database/verification/instrument_backup_20260818.csv', 'utf8');
  const backupLines = backup.split('\n').slice(1).filter(l => l.trim() !== '');
  const backupCodes = backupLines.map(l => { const p = l.split(','); return p[1].replace(/"/g, '').trim(); });
  
  const overlap = queueCodes.filter(c => backupCodes.includes(c));
  console.log('Overlap codes:', overlap);
  
  for (const code of overlap) {
    const qLine = lines.find(l => l.startsWith(code));
    const bLine = backupLines.find(l => { const p = l.split(','); return p[1].replace(/"/g, '').trim() === code; });
    console.log(code, 'Q:', qLine.split(',')[1], 'B:', bLine.split(',')[4]);
  }
  
  // Restore the 10 overlapping ones back to is_active=true
  if (overlap.length > 0) {
    const inClause = overlap.map(code => `'${code}'`).join(',');
    await c.query(`UPDATE stock_instruments SET is_active=true, listing_status='LISTED' WHERE stock_code IN (${inClause})`);
    console.log('Restored', overlap.length, 'to active.');
  }
  process.exit(0);
});
