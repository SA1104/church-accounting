const express = require('express');
const router = express.Router();
const { query } = require('../../core/db');
const { authenticateToken, requireRole } = require('../../core/auth');

const requireAccountingRole = (roles) => requireRole(roles, 'accounting');

// Helper to get active project ID
async function getActiveProjectId(req) {
  if (req.user && req.user.projectId) {
    return req.user.projectId;
  }
  const fallback = await query.get("SELECT project_id FROM platform_projects WHERE service_id = 'church_think' LIMIT 1");
  return fallback ? fallback.project_id : null;
}

// 1. 전체 마감 현황 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projectId = await getActiveProjectId(req);
    const locks = await query.all('SELECT * FROM church_closing_periods WHERE is_locked = 1 AND project_id = ?', [projectId]);
    res.json(locks);
  } catch (error) {
    console.error('Fetch locks error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 2. 결산 마감 설정
router.post('/lock', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { periodType, periodValue } = req.body;
  const { userId } = req.user;

  if (!periodType || !periodValue) {
    return res.status(400).json({ message: 'periodType and periodValue are required' });
  }

  try {
    const projectId = await getActiveProjectId(req);
    // In PostgreSQL, we can use ON CONFLICT to upsert
    await query.run(`
      INSERT INTO church_closing_periods (project_id, period_type, period_value, is_locked, locked_by)
      VALUES (?, ?, ?, 1, ?)
      ON CONFLICT (project_id, period_type, period_value) 
      DO UPDATE SET is_locked = 1, locked_by = EXCLUDED.locked_by
    `, [projectId, periodType, periodValue, userId]);

    // Audit logs (platform_audit_logs)
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, service_id, project_id, action, details, ip_address, result)
      VALUES (?, 'church_think', ?, 'LOCK_PERIOD', ?, ?, 'SUCCESS')
    `, [userId, projectId, `결산 마감 설정 - 구분: ${periodType}, 기간: ${periodValue}`, req.ip]);

    res.json({ message: `${periodValue} 결산 마감이 완료되었습니다.` });
  } catch (error) {
    console.error('Lock period error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 3. 결산 마감 해제
router.post('/unlock', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN']), async (req, res) => {
  const { periodType, periodValue } = req.body;
  const { userId } = req.user;

  if (!periodType || !periodValue) {
    return res.status(400).json({ message: 'periodType and periodValue are required' });
  }

  try {
    const projectId = await getActiveProjectId(req);
    await query.run(`
      DELETE FROM church_closing_periods 
      WHERE project_id = ? AND period_type = ? AND period_value = ?
    `, [projectId, periodType, periodValue]);

    // Audit logs (platform_audit_logs)
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, service_id, project_id, action, details, ip_address, result)
      VALUES (?, 'church_think', ?, 'UNLOCK_PERIOD', ?, ?, 'SUCCESS')
    `, [userId, projectId, `결산 마감 해제 - 구분: ${periodType}, 기간: ${periodValue}`, req.ip]);

    res.json({ message: `${periodValue} 결산 마감이 해제되었습니다.` });
  } catch (error) {
    console.error('Unlock period error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
