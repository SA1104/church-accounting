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
  const sql = `SELECT * FROM market_insights WHERE category = $1 LIMIT 1`;
  const { data, error } = await supabase.rpc('exec_sql', { query_text: sql, params: ['stock'] });
  if (error) return res.status(500).json({ error: error.message, sql });
  return res.json({ status: 'ok', data });
});

router.get('/debug2', async (req, res) => {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  const sql = `SELECT * FROM market_insights WHERE category = ? LIMIT 1`;
  const { data, error } = await supabase.rpc('exec_sql', { query_text: sql, params: ['stock'] });
  if (error) return res.status(500).json({ error: error.message, sql });
  return res.json({ status: 'ok', data });
});

// GET /api/services/insights?category=...
router.get('/', authenticateToken, async (req, res) => {
  const { category } = req.query;
  try {
    let sql = `
      SELECT * FROM market_insights
    `;
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
      `SELECT id FROM insight_reactions WHERE insight_id = $1 AND user_id = $2 AND reaction_type = 'LIKE'`,
      [id, userId]
    );
    
    if (!existing) {
      // Insert reaction
      await query.run(
        `INSERT INTO insight_reactions (insight_id, user_id, reaction_type) VALUES ($1, $2, 'LIKE')`,
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

module.exports = router;
