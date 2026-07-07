const express = require('express');
const router = express.Router();
const { query } = require('../../core/db');
const { authenticateToken } = require('../../core/auth');

// GET /api/platform/users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await query.all(`
      SELECT p.user_id, p.username, p.display_name, p.phone, p.avatar_url, p.is_active, p.user_status, p.created_at
      FROM platform_profiles p
    `);
    res.json({ users: users || [] });
  } catch (err) {
    console.error('[USERS GET]', err);
    res.status(500).json({ message: 'DB Error' });
  }
});

// GET /api/platform/users/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await query.get(
      'SELECT user_id, username, display_name, phone, avatar_url, is_active, user_status, created_at FROM platform_profiles WHERE user_id = ?',
      [req.params.id]
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'DB Error' });
  }
});

// PUT /api/platform/users/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { display_name, phone, avatar_url } = req.body;
    await query.run(
      'UPDATE platform_profiles SET display_name = ?, phone = ?, avatar_url = ? WHERE user_id = ?',
      [display_name, phone, avatar_url, req.params.id]
    );
    // Audit Log
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, project_id, action, details, ip_address, result)
      VALUES (?, ?, 'USER_UPDATE', ?, ?, 'SUCCESS')
    `, [req.user.userId, req.user.projectId, JSON.stringify({ target: req.params.id, display_name, phone }), req.ip || '']);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'DB Error' });
  }
});

// PATCH /api/platform/users/:id/block
router.patch('/:id/block', authenticateToken, async (req, res) => {
  try {
    await query.run(
      "UPDATE platform_profiles SET is_active = false, user_status = 'BLOCKED', blocked_at = CURRENT_TIMESTAMP, blocked_by = ? WHERE user_id = ?",
      [req.user.userId, req.params.id]
    );
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, project_id, action, details, ip_address, result)
      VALUES (?, ?, 'USER_BLOCK', ?, ?, 'SUCCESS')
    `, [req.user.userId, req.user.projectId, JSON.stringify({ target: req.params.id }), req.ip || '']);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'DB Error' });
  }
});

// PATCH /api/platform/users/:id/unblock
router.patch('/:id/unblock', authenticateToken, async (req, res) => {
  try {
    await query.run(
      "UPDATE platform_profiles SET is_active = true, user_status = 'ACTIVE', blocked_at = NULL, blocked_by = NULL WHERE user_id = ?",
      [req.params.id]
    );
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, project_id, action, details, ip_address, result)
      VALUES (?, ?, 'USER_UNBLOCK', ?, ?, 'SUCCESS')
    `, [req.user.userId, req.user.projectId, JSON.stringify({ target: req.params.id }), req.ip || '']);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'DB Error' });
  }
});

// PATCH /api/platform/users/:id/withdraw
router.patch('/:id/withdraw', authenticateToken, async (req, res) => {
  if (req.user.userId !== req.params.id) {
    return res.status(403).json({ message: 'You can only withdraw your own account' });
  }
  try {
    const { withdraw_reason } = req.body;
    await query.run(
      "UPDATE platform_profiles SET is_active = false, user_status = 'WITHDRAWN', withdraw_at = CURRENT_TIMESTAMP, withdraw_reason = ? WHERE user_id = ?",
      [withdraw_reason || '', req.params.id]
    );
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, project_id, action, details, ip_address, result)
      VALUES (?, ?, 'USER_WITHDRAW', ?, ?, 'SUCCESS')
    `, [req.user.userId, req.user.projectId, JSON.stringify({ target: req.params.id, reason: withdraw_reason }), req.ip || '']);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'DB Error' });
  }
});

// PATCH /api/platform/users/:id/reset-password
router.patch('/:id/reset-password', authenticateToken, async (req, res) => {
  try {
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, project_id, action, details, ip_address, result)
      VALUES (?, ?, 'USER_PASSWORD_RESET', ?, ?, 'SUCCESS')
    `, [req.user.userId, req.user.projectId, JSON.stringify({ target: req.params.id }), req.ip || '']);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'DB Error' });
  }
});

module.exports = router;
