const cron = require('node-cron');
const { syncAssemblyMembers } = require('./syncAssemblyMembers');
const { fetchAndStoreTrends } = require('./trendFetcher');

function initPoliticsCron() {
  console.log('[Cron:Politics] Registering politics cron jobs...');

  // Run weekly on Sunday at 3:00 AM KST - sync assembly member profiles
  cron.schedule('0 3 * * 0', () => {
    syncAssemblyMembers();
  }, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });

  // Run daily at 00:30 KST - fetch Naver Search Trend data for buzz scores
  cron.schedule('30 0 * * *', () => {
    console.log('[Cron:Politics] Running daily trend fetch...');
    fetchAndStoreTrends();
  }, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });

  // Run once on startup if the key is there, for initial backfill
  setTimeout(() => {
    syncAssemblyMembers();
  }, 15000); // 15 seconds after boot

  // Also fetch trends on startup (30 seconds after boot to let DB stabilize)
  setTimeout(() => {
    console.log('[Cron:Politics] Running initial trend fetch on startup...');
    fetchAndStoreTrends();
  }, 30000);
}

module.exports = { initPoliticsCron };
