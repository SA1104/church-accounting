const fs = require('fs');
const path = require('path');
const { query } = require('../../core/db');

async function initModuleDb() {
  console.log('[Insights DB] Initializing market_insights schema...');
  try {
    const sqlPath = path.join(__dirname, '..', '..', '..', 'database', 'migrations', '2026_09_02_market_insights.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Check if table exists first to avoid unnecessary errors
    const check = await query.get("SELECT to_regclass('public.market_insights') AS exists");
    if (!check || !check.exists) {
      console.log('[Insights DB] Table does not exist. Executing migration script...');
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const stmt of statements) {
        await query.run(stmt);
      }
      console.log('[Insights DB] Migration successful.');
    } else {
      console.log('[Insights DB] Schema already exists. Checking for dummy data...');
      const count = await query.get("SELECT COUNT(*) as c FROM public.market_insights");
      if (count && parseInt(count.c) === 0) {
        console.log('[Insights DB] Inserting dummy data...');
        // Insert dummy data if table is empty
        await query.run(`
          INSERT INTO public.market_insights (category, title, keywords, summary, impact_analysis, source_links, view_count, like_count) VALUES ('stock', 'AI Test Dummy 1', '{"AI", "Test"}', 'This is a test summary', 'This is an impact analysis', '[]', 145, 32), ('real_estate', 'AI Test Dummy 2', '{"Test"}', 'Test 2 summary', 'Test 2 impact', '[]', 320, 88);
        `);
      }
    }
    
    // Safety check: ensure insight_reactions table exists (if previous run crashed midway)
    const checkReact = await query.get("SELECT to_regclass('public.insight_reactions') AS exists");
    if (!checkReact || !checkReact.exists) {
      console.log('[Insights DB] insight_reactions missing! Executing creation...');
      await query.run(`
        CREATE TABLE public.insight_reactions (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            insight_id uuid REFERENCES public.market_insights(id) ON DELETE CASCADE,
            user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
            reaction_type text NOT NULL,
            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            UNIQUE(insight_id, user_id, reaction_type)
        )
      `);
      await query.run(`ALTER TABLE public.insight_reactions ENABLE ROW LEVEL SECURITY`);
      await query.run(`CREATE POLICY "Public can view reactions" ON public.insight_reactions FOR SELECT USING (true)`);
      await query.run(`CREATE POLICY "Users can insert reactions" ON public.insight_reactions FOR INSERT WITH CHECK (auth.uid() = user_id)`);
      await query.run(`CREATE POLICY "Users can delete reactions" ON public.insight_reactions FOR DELETE USING (auth.uid() = user_id)`);
    }

  } catch (err) {
    console.error('[Insights DB] Schema initialization failed:', err.message);
  }
}

module.exports = {
  initModuleDb
};
