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
