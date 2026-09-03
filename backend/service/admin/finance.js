const express = require('express');
const router = express.Router();
const { pool } = require('../../core/db');

// GET /api/admin/finance/assets
router.get('/assets', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, asset_type, name, provider, to_char(expiration_date, 'YYYY-MM-DD') as expiration_date, auto_renew, annual_cost_krw
      FROM finance_assets
      ORDER BY expiration_date ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[Finance API] Failed to fetch assets:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/admin/finance/costs
router.get('/costs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, category, year_month, amount_krw, description, created_at
      FROM finance_costs
      ORDER BY year_month DESC, category ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[Finance API] Failed to fetch costs:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
