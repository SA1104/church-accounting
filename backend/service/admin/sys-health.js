const express = require('express');
const router = express.Router();
const { pool } = require('../../core/db');
const { runInsightGenerationTask } = require('../insights/cron');
const { syncAssemblyMembers } = require('../politics/cron/syncAssemblyMembers');

// GET /api/admin/sys-health/cron-logs
router.get('/cron-logs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, job_name, status, message, execution_time, created_at
      FROM system_cron_logs
      ORDER BY created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[SysHealth API] Failed to fetch cron logs:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/admin/sys-health/metrics
router.get('/metrics', async (req, res) => {
  try {
    const q1 = pool.query(`SELECT COUNT(*) as c FROM politics_politicians`);
    const q2 = pool.query(`SELECT COUNT(*) as c FROM politics_trends`);
    const q3 = pool.query(`SELECT COUNT(*) as c FROM insight_candidates`);
    const q4 = pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success
      FROM system_cron_logs
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    
    const [res1, res2, res3, res4] = await Promise.all([q1, q2, q3, q4]);
    
    const polCount = parseInt(res1.rows[0].c, 10);
    const trendCount = parseInt(res2.rows[0].c, 10);
    const newsCount = parseInt(res3.rows[0].c, 10);
    
    const cronTotal = parseInt(res4.rows[0].total, 10) || 0;
    const cronSuccess = parseInt(res4.rows[0].success, 10) || 0;
    const successRate = cronTotal > 0 ? Math.round((cronSuccess / cronTotal) * 100) : 100;

    res.json({
      success: true,
      data: {
        total_apis: 4, // Naver News, Naver Trends, Assembly API, Supabase
        db_records: {
          politicians: polCount,
          trends: trendCount,
          news: newsCount
        },
        pipeline_health: {
          jobs_24h: cronTotal,
          success_rate: successRate
        }
      }
    });
  } catch (err) {
    console.error('[SysHealth API] Failed to fetch metrics:', err);
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// GET /api/admin/sys-health/candidates
router.get('/candidates', async (req, res) => {
  const { category } = req.query;
  try {
    let sql = `SELECT id, category, title, link, pub_date, description, is_used, created_at FROM insight_candidates WHERE is_used = false`;
    const params = [];
    if (category) {
      sql += ` AND category = $1`;
      params.push(category);
    }
    sql += ` ORDER BY created_at DESC, pub_date DESC LIMIT 50`;
    
    const result = await pool.query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[SysHealth API] Failed to fetch candidates:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/admin/sys-health/generate-hitl
router.post('/generate-hitl', async (req, res) => {
  const { category, candidateIds } = req.body;
  if (!category || !candidateIds || candidateIds.length === 0) {
    return res.status(400).json({ success: false, error: 'category and candidateIds are required' });
  }

  const { generateFromHITL } = require('../insights/cron');
  try {
    // Run it asynchronously in the background so it doesn't block the request
    generateFromHITL(category, candidateIds).catch(e => console.error(e));
    res.json({ success: true, message: `HITL generation triggered for ${category}.` });
  } catch (err) {
    console.error('[SysHealth API] Failed to trigger HITL job:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/admin/sys-health/trigger
router.post('/trigger', async (req, res) => {
  const { job_name } = req.body;
  
  if (!job_name) {
    return res.status(400).json({ success: false, error: 'job_name is required' });
  }

  try {
    if (job_name === 'generate_politics_insight') {
      // Run it asynchronously in the background
      runInsightGenerationTask().catch(e => console.error(e));
      res.json({ success: true, message: 'Insight generation triggered.' });
    } else if (job_name === 'sync_assembly_members') {
      syncAssemblyMembers().catch(e => console.error(e));
      res.json({ success: true, message: 'Assembly members sync triggered.' });
    } else {
      res.status(400).json({ success: false, error: 'Unknown job name' });
    }
  } catch (err) {
    console.error('[SysHealth API] Failed to trigger job:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
