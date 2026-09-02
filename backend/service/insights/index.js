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
    
    // Fetch all stock insights from 2026-09-02
    const { data: insights, error } = await supabase
      .from('market_insights')
      .select('id, category, created_at')
      .eq('category', 'stock')
      .gte('created_at', '2026-09-02T00:00:00Z')
      .lt('created_at', '2026-09-03T00:00:00Z')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    if (insights.length <= 1) {
      return res.json({ success: true, message: 'No duplicates to clean.', deletedCount: 0 });
    }
    
    // Keep the first one (most recent), delete all others
    const toDelete = insights.slice(1).map(i => i.id);
    
    const { error: delError } = await supabase
      .from('market_insights')
      .delete()
      .in('id', toDelete);
      
    if (delError) throw delError;
    
    res.json({ success: true, message: 'Aggressively cleaned Sep 2nd stock duplicates', deletedCount: toDelete.length, toDelete });
  } catch (error) {
    console.error('[Admin Clean] Failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
