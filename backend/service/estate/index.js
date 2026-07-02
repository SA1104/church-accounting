// backend/service/estate/index.js
// Estate Think - Capability Router (Platform 3.1)
// Handles Estate Think workspace configuration and stub APIs
const express = require('express');
const router = express.Router();
const { query } = require('../../core/db');

// GET /api/estate/workspace
router.get('/workspace', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    let ws = await query.get('SELECT * FROM public.estate_workspaces WHERE user_id = ? AND is_active = TRUE LIMIT 1', [userId]);
    if (!ws) {
      const result = await query.run(
        'INSERT INTO public.estate_workspaces (user_id, name, region, is_active) VALUES (?, ?, ?, TRUE) RETURNING workspace_id',
        [userId, '서울권 분석', '서울']
      );
      ws = {
        workspace_id: result.id,
        user_id: userId,
        name: '서울권 분석',
        region: '서울'
      };
      await query.run(
        'INSERT INTO public.platform_workspaces (workspace_id, capability, name, owner_id, is_active) VALUES (?, ?, ?, ?, TRUE)',
        [result.id, 'estate', '서울권 분석', userId]
      );
    }
    res.json(ws);
  } catch (err) {
    console.error('[Estate workspace] Error:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/estate/analysis
router.get('/analysis', async (req, res) => {
  res.json([]);
});

module.exports = router;
