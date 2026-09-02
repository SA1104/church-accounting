const cron = require('node-cron');
const { syncAssemblyMembers } = require('./syncAssemblyMembers');

function initPoliticsCron() {
  console.log('[Cron:Politics] Registering politics cron jobs...');

  // Run weekly on Sunday at 3:00 AM KST
  cron.schedule('0 3 * * 0', () => {
    syncAssemblyMembers();
  }, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });

  // Run once on startup if the key is there, for initial backfill
  setTimeout(() => {
    syncAssemblyMembers();
  }, 15000); // 15 seconds after boot
}

module.exports = { initPoliticsCron };
