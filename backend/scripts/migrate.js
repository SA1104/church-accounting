'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../lib/db');

(async () => {
  const s = await db.init();
  const rls = await db.rlsStatus();
  console.log('[migrate] state:', JSON.stringify(s));
  console.log('[migrate] rls:', JSON.stringify(rls));
  await db.close();
  if (s.connected && (!rls.bizSimulatorRunsRls || rls.rlsDisabledCount > 0)) {
    process.exit(1);
  }
})();
