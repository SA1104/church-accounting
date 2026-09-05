const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({connectionString: process.env.DATABASE_URL});
const { generateFromHITL } = require('./backend/service/insights/cron');
const query = {
  get: async (sql, params = []) => {
    const { rows } = await pool.query(sql, params);
    return rows[0] || null;
  },
  all: async (sql, params = []) => {
    const { rows } = await pool.query(sql, params);
    return rows || [];
  }
};

(async () => {
    console.log('[Cron] Manual Triggering Auto-Pilot fallback...');
    const categories = ['stock', 'real_estate', 'economy', 'politics'];
    
    for (const category of categories) {
      try {
        console.log(`[Cron] Auto-Pilot triggered for ${category}.`);
        // Fetch up to 10 unused candidates
        const candidatesRes = await query.all(`
          SELECT id FROM public.insight_candidates 
          WHERE category = $1 AND is_used = false 
          ORDER BY created_at DESC 
          LIMIT 10
        `, [category]);
        
        if (candidatesRes && candidatesRes.length > 0) {
          const candidateIds = candidatesRes.map(c => c.id);
          console.log(`[Cron] Generating for ${category} with ${candidateIds.length} articles...`);
          await generateFromHITL(category, candidateIds);
          console.log(`[Cron] Generated for ${category}!`);
        } else {
          console.log(`[Cron] No candidates available for Auto-Pilot in ${category}.`);
        }
      } catch (err) {
        console.error(`[Cron] Auto-Pilot failed for ${category}:`, err);
      }
    }
    process.exit(0);
})();
