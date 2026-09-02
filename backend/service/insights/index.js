const express = require('express');
const router = express.Router();
const { query } = require('../../core/db');
const { authenticateToken } = require('../../core/auth');
const { initCron } = require('./cron');

// Initialize the background cron job for AI insights
initCron();

// DEBUG ROUTE (Temporary)
router.get('/debug1', async (req, res) => {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  
  const fs = require('fs');
  const path = require('path');
  try {
    const sqlPath1 = path.join(__dirname, '../../../database/migrations/2026_09_01_universal_board.sql');
    const sqlPath2 = path.join(__dirname, '../../../database/migrations/2026_09_02_market_insights.sql');
    
    let sql1 = fs.readFileSync(sqlPath1, 'utf8').replace(/BEGIN;/g, '').replace(/COMMIT;/g, '');
    let sql2 = fs.readFileSync(sqlPath2, 'utf8').replace(/BEGIN;/g, '').replace(/COMMIT;/g, '');
    
    // Just run them consecutively
    const res1 = await supabase.rpc('exec_sql', { query_text: sql1, params: [] });
    const res2 = await supabase.rpc('exec_sql', { query_text: sql2, params: [] });
    
    return res.json({ status: 'ok', res1, res2 });
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

router.get('/debug2', async (req, res) => {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  const sql = `SELECT COUNT(*) FROM stock_daily_bars`;
  const { data, error } = await supabase.rpc('exec_sql', { query_text: sql, params: [] });
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ count: data });
});

// GET /api/services/insights?category=...
router.get('/', async (req, res) => {
  const { category } = req.query;
  try {
    let sql = `SELECT * FROM market_insights`;
    const params = [];
    
    if (category) {
      sql += ` WHERE category = ?`;
      params.push(category);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT 20`;
    
    const insights = await query.all(sql, params);
    res.json(insights);
  } catch (error) {
    console.error('[Insights API] Failed to fetch insights:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/services/insights/:id/view
router.post('/:id/view', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Simple view count increment (in production, we'd want to track unique views)
    await query.run(`UPDATE market_insights SET view_count = view_count + 1 WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('[Insights API] Failed to update view count:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/services/insights/:id/like
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if already liked
    const existing = await query.get(
      `SELECT id FROM insight_reactions WHERE insight_id = ? AND user_id = ? AND reaction_type = 'LIKE'`,
      [id, userId]
    );
    
    if (!existing) {
      // Insert reaction
      await query.run(
        `INSERT INTO insight_reactions (insight_id, user_id, reaction_type) VALUES (?, ?, 'LIKE')`,
        [id, userId]
      );
      // Increment counter
      await query.run(`UPDATE market_insights SET like_count = like_count + 1 WHERE id = ?`, [id]);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Insights API] Failed to like insight:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/services/insights/admin/dedupe (Temp route to clean up September 2nd duplicates)
router.get('/admin/dedupe', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(400).json({ error: 'Missing SUPABASE_URL or SUPABASE_SECRET_KEY' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 1. Fetch all insights from 2026-09-02
    const { data: insights, error } = await supabase
      .from('market_insights')
      .select('id, category, title, created_at')
      .gte('created_at', '2026-09-02T00:00:00Z')
      .lt('created_at', '2026-09-03T00:00:00Z')
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    
    // 2. Identify duplicates by title
    const seenTitles = new Set();
    const toDelete = [];
    
    for (const insight of insights) {
      if (seenTitles.has(insight.title)) {
        toDelete.push(insight.id);
      } else {
        seenTitles.add(insight.title);
      }
    }
    
    // 3. Delete duplicates
    let deletedCount = 0;
    if (toDelete.length > 0) {
      const { error: delError } = await supabase
        .from('market_insights')
        .delete()
        .in('id', toDelete);
        
      if (delError) throw delError;
      deletedCount = toDelete.length;
    }
    
    res.json({ success: true, deletedCount, toDelete });
  } catch (error) {
    console.error('[Admin Dedupe] Failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/services/insights/admin/clean-sep2 (Aggressive cleanup for Sep 2nd)
router.get('/admin/clean-sep2', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(400).json({ error: 'Missing SUPABASE_URL or SUPABASE_SECRET_KEY' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch all stock and real_estate insights from 2026-09-02
    const { data: insights, error } = await supabase
      .from('market_insights')
      .select('id, category, created_at')
      .in('category', ['stock', 'real_estate'])
      .gte('created_at', '2026-09-02T00:00:00Z')
      .lt('created_at', '2026-09-03T00:00:00Z')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Group by category
    const byCategory = { stock: [], real_estate: [] };
    insights.forEach(i => byCategory[i.category].push(i.id));
    
    const toDelete = [];
    if (byCategory.stock.length > 1) {
      toDelete.push(...byCategory.stock.slice(1));
    }
    if (byCategory.real_estate.length > 1) {
      toDelete.push(...byCategory.real_estate.slice(1));
    }
    
    if (toDelete.length === 0) {
      return res.json({ success: true, message: 'No duplicates to clean.', deletedCount: 0 });
    }
    
    const { error: delError } = await supabase
      .from('market_insights')
      .delete()
      .in('id', toDelete);
      
    if (delError) throw delError;
    
    res.json({ success: true, message: 'Aggressively cleaned Sep 2nd duplicates', deletedCount: toDelete.length, toDelete });
  } catch (error) {
    console.error('[Admin Clean] Failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/services/insights/admin/setup-politics
router.get('/admin/setup-politics', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { Pool } = require('pg');
    // Connect directly to the Render-injected DATABASE_URL
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // 1. Run migration
    const sqlPath = path.join(__dirname, '../../../database/migrations/2026_09_02_politics_schema.sql');
    let sql = fs.readFileSync(sqlPath, 'utf8');
    if (sql.charCodeAt(0) === 0xFEFF) sql = sql.slice(1);
    await pool.query(sql);
    
    // 2. Fetch and Insert Wikipedia Data
    async function fetchWikiSummary(title) {
      const url = `https://ko.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro&titles=${encodeURIComponent(title)}&format=json&pithumbsize=500`;
      const wikiRes = await fetch(url);
      const data = await wikiRes.json();
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      if (pageId === '-1') return null;
      return {
        imageUrl: pages[pageId].thumbnail ? pages[pageId].thumbnail.source : null,
        namuwikiUrl: `https://namu.wiki/w/${encodeURIComponent(title)}`
      };
    }

    const politicians = ['이재명', '한동훈', '안철수'];
    for (const name of politicians) {
      const wikiData = await fetchWikiSummary(name);
      if (wikiData) {
        const insertQ = `
          INSERT INTO politics_politicians (name, gender, profile_image_url, namuwiki_url) 
          VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING id;
        `;
        let pRes = await pool.query(insertQ, [name, 'M', wikiData.imageUrl, wikiData.namuwikiUrl]);
        let pId = pRes.rows.length > 0 ? pRes.rows[0].id : null;
        if (!pId) {
          pRes = await pool.query(`SELECT id FROM politics_politicians WHERE name = $1`, [name]);
          pId = pRes.rows[0].id;
        }
        
        const buzz = Math.floor(Math.random() * 30) + 70; 
        const wealth = Math.floor(Math.random() * 5000000000) + 1000000000;
        const fulfill = Math.floor(Math.random() * 40) + 50;
        
        await pool.query(`
          INSERT INTO politics_annual_stats (politician_id, record_year, declared_wealth, pledge_fulfillment_rate, attendance_rate, buzz_index, approval_rating)
          VALUES ($1, 2026, $2, $3, 95.0, $4, 40.0)
          ON CONFLICT (politician_id, record_year) DO NOTHING;
        `, [pId, wealth, fulfill, buzz]);
      }
    }
    
    pool.end();
    res.json({ success: true, message: 'Politics DB initialized on production' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
