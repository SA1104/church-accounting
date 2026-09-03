const path = require('path');
require('dotenv').config({path: path.join(__dirname, 'backend', '.env.development')});
const { query, initPlatformDb } = require('./backend/core/db');

async function test() {
  await initPlatformDb();
  console.log("Testing query.all with $1...");
  const res1 = await query.all("SELECT * FROM market_insights WHERE category = $1", ['stock']);
  console.log("Res1:", res1);
  
  console.log("Testing query.all with ?...");
  const res2 = await query.all("SELECT * FROM market_insights WHERE category = ?", ['stock']);
  console.log("Res2:", res2);
  
  process.exit(0);
}
test();
