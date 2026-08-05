const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateToken, requireRole } = require('../auth');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || 'your-service-role-key';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Require SYSTEM_ADMIN for all routes in this module
router.use(authenticateToken);
router.use(requireRole(['SYSTEM_ADMIN']));

// GET /api/platform/admin/users
router.get('/', async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let sql = 
      SELECT u.user_id, u.username, u.email, u.display_name, u.phone, u.is_active, u.created_at,
             r.role_id as system_role
      FROM platform_profiles u
      LEFT JOIN platform_role_assignments r ON u.user_id = r.user_id AND r.service_id = 'platform'
      WHERE 1=1
    ;
    const params = [];

    if (search) {
      sql +=  AND (u.display_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?);
      params.push(%%, %%, %%);
    }

    if (status === 'active') {
      sql +=  AND u.is_active = TRUE;
    } else if (status === 'inactive') {
      sql +=  AND u.is_active = FALSE;
    }

    if (role) {
      sql +=  AND r.role_id = ?;
      params.push(role);
    }

    sql +=  ORDER BY u.created_at DESC;

    const users = await query.all(sql, params);
    res.json(users);
  } catch (error) {
    console.error('[ADMIN USERS GET ERROR]', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// GET /api/platform/admin/users/:id/auth-status
router.get('/:id/auth-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
    if (error) {
      return res.status(404).json({ auth_exists: false, message: error.message });
    }
    res.json({
      auth_exists: true,
      email: data.user.email,
      email_confirmed_at: data.user.email_confirmed_at,
      last_sign_in_at: data.user.last_sign_in_at,
      banned_until: data.user.banned_until
    });
  } catch (err) {
    console.error('[ADMIN AUTH STATUS ERROR]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/platform/admin/users/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    await query.run(UPDATE platform_profiles SET is_active = ? WHERE user_id = ?, [is_active ? 1 : 0, id]);
    
    // Log audit
    await query.run(
      INSERT INTO platform_audit_logs (user_id, service_id, project_id, action, details, ip_address, result)
      VALUES (?, 'platform', 'system', 'UPDATE_USER_STATUS', ?, ?, 'SUCCESS')
    , [req.user.userId, User  status set to , req.ip]);
    
    res.json({ success: true, message: \계정이  되었습니다.\ });
  } catch (err) {
    console.error('[ADMIN USER STATUS ERROR]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/platform/admin/users/:id/temp-password
router.post('/:id/temp-password', async (req, res) => {
  try {
    const { id } = req.params;
    const tempPassword = Math.random().toString(36).slice(-8) + '!';
    
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: tempPassword
    });
    
    if (error) {
      return res.status(400).json({ success: false, message: 'Auth 시스템에서 비밀번호 변경에 실패했습니다.' });
    }
    
    // 강제 비밀번호 변경 플래그 설정
    await query.run(UPDATE platform_profiles SET must_change_password = 1 WHERE user_id = ?, [id]);
    
    await query.run(
      INSERT INTO platform_audit_logs (user_id, service_id, project_id, action, details, ip_address, result)
      VALUES (?, 'platform', 'system', 'ISSUE_TEMP_PASSWORD', ?, ?, 'SUCCESS')
    , [req.user.userId, Issued temp password for User , req.ip]);
    
    res.json({ success: true, tempPassword, message: '임시 비밀번호가 발급되었습니다. 즉시 사용자에게 전달하세요.' });
  } catch (err) {
    console.error('[ADMIN TEMP PASSWORD ERROR]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
