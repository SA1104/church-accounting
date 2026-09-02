const express = require('express');
const router = express.Router();
const db = require('../../core/db');
const { initPoliticsCron } = require('./cron');

// Initialize the background cron jobs for politics
initPoliticsCron();

// GET /api/services/politics/politicians
// Fetch all politicians with their latest stats for the radar chart
router.get('/politicians', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const queryText = `
      SELECT 
        p.id, p.name, p.profile_image_url, p.gender, p.namuwiki_url, p.party_name, p.role_type,
        s.record_year, s.declared_wealth, s.pledge_fulfillment_rate, 
        s.attendance_rate, s.buzz_index, s.approval_rating, s.dynamic_metrics
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
      role_type: p.role_type || 'ASSEMBLY_MEMBER',
      imageUrl: p.profile_image_url,
      namuwikiUrl: p.namuwiki_url,
      stats: {
        wealth: p.declared_wealth,
        pledge: parseFloat(p.pledge_fulfillment_rate),
        attendance: parseFloat(p.attendance_rate),
        buzz: p.buzz_index,
        approval: parseFloat(p.approval_rating)
      },
      dynamic_metrics: p.dynamic_metrics || {}
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('[Politics API] Failed to fetch politicians:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.get('/admin/migrate-party', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    await pool.query('ALTER TABLE politics_politicians ADD COLUMN IF NOT EXISTS party_name VARCHAR(100)');
    await pool.query(`UPDATE politics_politicians SET party_name = '더불어민주당' WHERE name = '이재명'`);
    await pool.query(`UPDATE politics_politicians SET party_name = '국민의힘' WHERE name IN ('한동훈', '안철수')`);
    
    // NEW: Role migration
    await pool.query(`ALTER TABLE politics_politicians ADD COLUMN IF NOT EXISTS role_type VARCHAR(50) DEFAULT 'ASSEMBLY_MEMBER'`);
    await pool.query(`ALTER TABLE politics_annual_stats ADD COLUMN IF NOT EXISTS dynamic_metrics JSONB DEFAULT '{}'::jsonb`);
    
    await pool.query(`UPDATE politics_politicians SET role_type = 'EXTRA_PARLIAMENTARY' WHERE name = '한동훈'`);
    
    const checkOh = await pool.query(`SELECT id FROM politics_politicians WHERE name = '오세훈'`);
    let ohId;
    if (checkOh.rows.length > 0) {
      ohId = checkOh.rows[0].id;
      await pool.query(`UPDATE politics_politicians SET role_type = 'MAYOR' WHERE id = $1`, [ohId]);
    } else {
      const ohRes = await pool.query(`
        INSERT INTO politics_politicians (id, name, profile_image_url, gender, party_name, namuwiki_url, role_type, created_at, updated_at)
        VALUES (gen_random_uuid(), '오세훈', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Oh_Se-hoon_in_2021.jpg/500px-Oh_Se-hoon_in_2021.jpg', 'MALE', '국민의힘', 'https://namu.wiki/w/%EC%98%A4%EC%84%B8%ED%9B%88', 'MAYOR', NOW(), NOW())
        RETURNING id
      `);
      ohId = ohRes.rows[0].id;
    }
    
    const checkStats = await pool.query(`SELECT 1 FROM politics_annual_stats WHERE politician_id = $1 AND record_year = 2026`, [ohId]);
    if (checkStats.rows.length > 0) {
      await pool.query(`UPDATE politics_annual_stats SET buzz_index = 85 WHERE politician_id = $1 AND record_year = 2026`, [ohId]);
    } else {
      await pool.query(`
        INSERT INTO politics_annual_stats (politician_id, record_year, declared_wealth, buzz_index, dynamic_metrics)
        VALUES ($1, 2026, 5900000000, 85, '{"admin_rating": 72, "budget_execution": 95, "presidential_support": 35}')
      `, [ohId]);
    }
    
    await pool.query(`
      UPDATE politics_annual_stats 
      SET dynamic_metrics = '{"party_control": 88, "presidential_support": 42}'
      WHERE politician_id = (SELECT id FROM politics_politicians WHERE name = '한동훈')
    `);
    
    await pool.end();
    res.json({ success: true, message: 'party_name and role_type migrated on production DB' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/services/politics/ratings/:id
// Returns mock historical trend data (approval & buzz) for the last 6 months
router.get('/ratings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Generate deterministic mock data based on ID so it looks stable
    const baseApproval = 20 + (id.charCodeAt(0) % 40); 
    const baseBuzz = 30 + (id.charCodeAt(1) % 50);
    
    const months = ['3월', '4월', '5월', '6월', '7월', '8월'];
    const data = months.map((month, index) => {
      return {
        month,
        approval: Math.min(100, Math.max(0, baseApproval + (Math.sin(index) * 15) + (index * 2))),
        buzz: Math.min(100, Math.max(0, baseBuzz + (Math.cos(index) * 20) - (index * 1)))
      };
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
