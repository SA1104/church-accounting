// backend/service/mission/index.js
// Mission Think - Capability Router (Platform 3.1)
// Handles Mission Think workspace and prayer configurations
const express = require('express');
const router = express.Router();
const { query } = require('../../core/db');

// GET /api/mission/workspace
router.get('/workspace', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    let ws = await query.get('SELECT * FROM public.mission_workspaces WHERE user_id = ? AND is_active = TRUE LIMIT 1', [userId]);
    if (!ws) {
      const result = await query.run(
        'INSERT INTO public.mission_workspaces (user_id, name, country, is_active) VALUES (?, ?, ?, TRUE) RETURNING workspace_id',
        [userId, '선교 협력', '인도']
      );
      ws = {
        workspace_id: result.id,
        user_id: userId,
        name: '선교 협력',
        country: '인도'
      };
      await query.run(
        'INSERT INTO public.platform_workspaces (workspace_id, capability, name, owner_id, is_active) VALUES (?, ?, ?, ?, TRUE)',
        [result.id, 'mission', '선교 협력', userId]
      );
    }
    res.json(ws);
  } catch (err) {
    console.error('[Mission workspace] Error:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/mission/prayers
router.get('/prayers', async (req, res) => {
  res.json([]);
});

module.exports = router;
