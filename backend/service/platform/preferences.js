const express = require('express');
const router = express.Router();
const { query } = require('../../core/db');
const { authenticateToken } = require('../../core/auth');

// GET /api/platform/preferences/:serviceId/:key
router.get('/:serviceId/:key', authenticateToken, async (req, res) => {
  try {
    const { serviceId, key } = req.params;
    const userId = req.user.userId;

    const pref = await query.get(
      'SELECT preference_value FROM public.platform_user_preferences WHERE user_id = ? AND service_id = ? AND preference_key = ?',
      [userId, serviceId, key]
    );

    if (pref) {
      // Return as JSON directly; preference_value should be parsed if it's stored as JSON string in mock DB,
      // or directly if returned as object from postgres pg plugin.
      let val = pref.preference_value;
      if (typeof val === 'string') {
        try { val = JSON.parse(val); } catch (e) { }
      }
      res.json(val);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('[PREF GET]', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// PATCH /api/platform/preferences
router.patch('/', authenticateToken, async (req, res) => {
  try {
    const { service_id, preference_key, preference_value } = req.body;
    const userId = req.user.userId;

    if (!service_id || !preference_key || preference_value === undefined) {
      return res.status(400).json({ message: 'Missing required preference fields.' });
    }

    const valString = typeof preference_value === 'object' ? JSON.stringify(preference_value) : preference_value;

    await query.run(`
      INSERT INTO public.platform_user_preferences (user_id, service_id, preference_key, preference_value, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, service_id, preference_key)
      DO UPDATE SET preference_value = EXCLUDED.preference_value, updated_at = CURRENT_TIMESTAMP
    `, [userId, service_id, preference_key, valString]);

    res.json({ success: true, message: 'Preference updated successfully.' });
  } catch (error) {
    console.error('[PREF PATCH]', error);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
