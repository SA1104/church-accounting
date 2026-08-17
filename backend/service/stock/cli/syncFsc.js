require('dotenv').config();
const { FscStockPriceProvider, FSC_API } = require('../providers/FscStockPriceProvider');
const StockRepository = require('../repositories/StockRepository');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  let dryRun = false, force = false, fixture = false, targetDate = null, markets = ['KOSPI'];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') dryRun = true;
    if (args[i] === '--force') force = true;
    if (args[i] === '--fixture') fixture = true;
    if (args[i] === '--date') targetDate = args[i + 1];
    if (args[i] === '--market') markets = [args[i + 1]];
    if (args[i] === '--markets') markets = args[i + 1].split(',');
  }

  if (targetDate && !force) {
    const d = new Date(targetDate.slice(0,4) + '-' + targetDate.slice(4,6) + '-' + targetDate.slice(6,8));
    const day = d.getDay();
    if (day === 0 || day === 6) {
      console.warn('[FSC Sync] Warning: Weekend detected (' + targetDate + '). Use --force to proceed if this is a known trading day.');
      process.exit(0);
    }
  }

  const provider = new FscStockPriceProvider({ dryRun, fixture });
  const repo = new StockRepository(null);

  console.log('[FSC Sync] Command: ' + command + ' | Dry Run: ' + dryRun + ' | Date: ' + targetDate + ' | Markets: ' + markets.join(','));

  const health = await provider.healthCheck();
  if (health.status === 'DISABLED_MISSING_KEY' && !fixture) {
    console.log('[FSC Sync] Status: READY_FOR_KEY');
    process.exit(0);
  }
  if (command === 'health') { console.log('[FSC Sync] Health: ' + health.status); process.exit(0); }

  try {
    if (command === 'sync-master') {
      for (const market of markets) {
        const data = await provider.fetchInstruments({ market, fixture });
        const res = await repo.upsertInstruments(data.records, { dryRun, force });
        console.log('[FSC Sync] Master Upsert: ' + JSON.stringify(res));
      }
    } else if (command === 'sync-daily') {
      for (const market of markets) {
        const data = await provider.fetchDailyBars({ market, date: targetDate, fixture });
        const res = await repo.upsertDailyBars(data.records, { dryRun, force });
        console.log('[FSC Sync] Daily Upsert: ' + JSON.stringify(res));
      }
    }
  } catch(e) { console.error('Failed:', e.message); process.exit(1); }
}
main();
