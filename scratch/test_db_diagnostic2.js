global.WebSocket = require('ws');
// Load env variables
require('dotenv').config({ path: require('fs').existsSync('.env') ? '.env' : 'backend/.env' });
process.env.SUPABASE_URL = 'https://real-project.supabase.co'; // Force Postgres mode
const db = require('../backend/core/db/index.js');

async function test() {
  const query = db.query;
  console.log("Database diagnostic starting...");

  try {
    const time = await query.get("SELECT NOW() as now");
    console.log("Current DB Time:", time.now);
  } catch (e) {
    console.error("Connection test failed:", e);
    return;
  }

  const queries = [
    {
      name: "Check platform_profiles",
      sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'platform_profiles' AND table_schema = 'public'"
    },
    {
      name: "Check platform_role_assignments",
      sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'platform_role_assignments' AND table_schema = 'public'"
    },
    {
      name: "Check church_user_assignments",
      sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'church_user_assignments' AND table_schema = 'public'"
    },
    {
      name: "Check church_account_categories",
      sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'church_account_categories' AND table_schema = 'public'"
    }
  ];

  for (const q of queries) {
    console.log(`\n=== ${q.name} ===`);
    try {
      const cols = await query.all(q.sql);
      if (cols && cols.length > 0) {
        cols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
      } else {
        console.log("  No columns or table not found!");
      }
    } catch (e) {
      console.error(`  Error:`, e.message);
    }
  }

  // Let's also check if there's any active user assignment or role mapping
  try {
    const userCount = await query.get("SELECT count(*) as count FROM public.platform_profiles");
    console.log("\nTotal Users in platform_profiles:", userCount.count);
    
    const roleCount = await query.get("SELECT count(*) as count FROM public.platform_role_assignments");
    console.log("Total platform_role_assignments:", roleCount.count);

    const assignCount = await query.get("SELECT count(*) as count FROM public.church_user_assignments");
    console.log("Total church_user_assignments:", assignCount.count);
  } catch (e) {
    console.error("\nCounts query failed:", e.message);
  }
}

test().then(() => process.exit(0)).catch(console.error);
