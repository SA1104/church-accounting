const express = require('express');
const router = express.Router();
const db = require('../../core/db');

// GET /api/services/politics/politicians
// Fetch all politicians with their latest stats for the radar chart
router.get('/politicians', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const queryText = `
      SELECT 
        p.id, p.name, p.profile_image_url, p.gender, p.namuwiki_url, p.party_name,
        s.record_year, s.declared_wealth, s.pledge_fulfillment_rate, 
        s.attendance_rate, s.buzz_index, s.approval_rating
      FROM politics_politicians p
      LEFT JOIN politics_annual_stats s 
        ON p.id = s.politician_id 
        AND s.record_year = (
          SELECT MAX(record_year) FROM politics_annual_stats WHERE politician_id = p.id
        )
      ORDER BY p.name ASC
    `;
    const result = await pool.query(queryText);
    await pool.end();
    
    const rows = result.rows;
    
    // Format them for the frontend
    const formatted = rows.map(p => ({
      id: p.id,
      name: p.name,
      party: p.party_name,
      imageUrl: p.profile_image_url,
      namuwikiUrl: p.namuwiki_url,
      stats: {
        wealth: p.declared_wealth,
        pledge: parseFloat(p.pledge_fulfillment_rate),
        attendance: parseFloat(p.attendance_rate),
        buzz: p.buzz_index,
        approval: parseFloat(p.approval_rating)
      }
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('[Politics API] Failed to fetch politicians:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
