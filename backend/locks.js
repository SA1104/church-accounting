const express = require('express');
const router = express.Router();
const { query } = require('./db');
const { authenticateToken, requireRole } = require('./auth');

// 1. 전체 마감 현황 조회 (누구나 조회 가능)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const locks = await query.all('SELECT * FROM period_locks WHERE is_locked = 1');
    res.json(locks);
  } catch (error) {
    console.error('Fetch locks error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 2. 결산 마감 설정 (SYSTEM_ADMIN, FINANCE_MANAGER 가능)
router.post('/lock', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { periodType, periodValue } = req.body;
  const { userId, position } = req.user;

  if (!periodType || !periodValue) {
    return res.status(400).json({ message: 'periodType and periodValue are required' });
  }

  try {
    await query.run(`
      INSERT OR REPLACE INTO period_locks (period_type, period_value, is_locked, locked_by)
      VALUES (?, ?, 1, ?)
    `, [periodType, periodValue, userId]);

    // 마감 설정 감사 로그 기록
    await query.run(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_position, result)
      VALUES (?, 'LOCK_PERIOD', ?, ?, ?, 'SUCCESS')
    `, [userId, `결산 마감 설정 - 구분: ${periodType}, 기간: ${periodValue}`, req.ip, position]);

    res.json({ message: `${periodValue} 결산 마감이 완료되었습니다.` });
  } catch (error) {
    console.error('Lock period error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 3. 결산 마감 해제 (오직 SYSTEM_ADMIN만 가능)
router.post('/unlock', authenticateToken, requireRole(['SYSTEM_ADMIN']), async (req, res) => {
  const { periodType, periodValue } = req.body;
  const { userId, position } = req.user;

  if (!periodType || !periodValue) {
    return res.status(400).json({ message: 'periodType and periodValue are required' });
  }

  try {
    await query.run(`
      DELETE FROM period_locks 
      WHERE period_type = ? AND period_value = ?
    `, [periodType, periodValue]);

    // 마감 해제 감사 로그 기록
    await query.run(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_position, result)
      VALUES (?, 'UNLOCK_PERIOD', ?, ?, ?, 'SUCCESS')
    `, [userId, `결산 마감 해제 - 구분: ${periodType}, 기간: ${periodValue}`, req.ip, position]);

    res.json({ message: `${periodValue} 결산 마감이 해제되었습니다.` });
  } catch (error) {
    console.error('Unlock period error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;