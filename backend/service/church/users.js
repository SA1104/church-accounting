// backend/service/church/users.js
// Church Think - User Management API

const express = require('express');
const router = express.Router();
const { query, supabase } = require('../../core/db');
const { authenticateToken, requireRole } = require('../../core/auth');
const bcrypt = require('bcrypt');

async function getActiveProjectId(req) {
  if (req.user && req.user.projectId) return req.user.projectId;
  if (req.user && req.user.activeProjectId) return req.user.activeProjectId;
  const fallback = await query.get("SELECT project_id FROM public.platform_projects WHERE service_id = 'church_think' LIMIT 1");
  if (fallback) return fallback.project_id;
  const anyProject = await query.get('SELECT project_id FROM public.platform_projects LIMIT 1');
  return anyProject ? anyProject.project_id : null;
}

// GET /api/church/users
router.get('/', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  try {
    const projectId = await getActiveProjectId(req);
    const users = await query.all(`
      SELECT p.*, r.role_id, a.id as assignment_id, a.committee_id, a.group_id, a.position_id, a.role_code as assignment_role, a.status as assignment_status
      FROM public.platform_profiles p
      JOIN public.platform_memberships m ON p.user_id = m.user_id AND m.project_id = ?
      LEFT JOIN public.platform_role_assignments r ON p.user_id = r.user_id AND r.project_id = ?
      LEFT JOIN public.church_user_assignments a ON p.user_id = a.user_id AND a.project_id = ? AND a.is_primary = TRUE AND a.is_active = TRUE
      ORDER BY p.created_at DESC
    `, [projectId, projectId, projectId]);
    res.json(users);
  } catch (error) {
    console.error('[USERS GET]', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/church/users/:id
router.get('/:id', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  try {
    const projectId = await getActiveProjectId(req);
    const user = await query.get(`
      SELECT p.*, r.role_id
      FROM public.platform_profiles p
      JOIN public.platform_memberships m ON p.user_id = m.user_id AND m.project_id = ?
      LEFT JOIN public.platform_role_assignments r ON p.user_id = r.user_id AND r.project_id = ?
      WHERE p.user_id = ?
    `, [projectId, projectId, req.params.id]);
    
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    res.json(user);
  } catch (error) {
    console.error('[USER GET]', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// POST /api/church/users
router.post('/', authenticateToken, requireRole(['SYSTEM_ADMIN']), async (req, res) => {
  try {
    const { username, password, name, email, phone, role } = req.body;
    const projectId = await getActiveProjectId(req);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email || `${username}@example.com`,
      password: password,
      email_confirm: true,
      user_metadata: { username, display_name: name, role: role || 'member' }
    });

    if (authError) {
      console.error('[USERS POST] Auth Error:', authError);
      return res.status(400).json({ message: '사용자 생성에 실패했습니다 (Auth).', details: authError.message });
    }

    const userId = authData.user.id;

    // Platform profile
    await query.run(`
      INSERT INTO public.platform_profiles (user_id, username, display_name, phone)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (user_id) DO UPDATE SET username = EXCLUDED.username, display_name = EXCLUDED.display_name, phone = EXCLUDED.phone
    `, [userId, username, name, phone || null]);

    // Platform membership
    await query.run(`
      INSERT INTO public.platform_memberships (user_id, project_id, is_active)
      VALUES (?, ?, TRUE)
      ON CONFLICT (user_id, project_id) DO NOTHING
    `, [userId, projectId]);

    // Role
    if (role) {
      await query.run(`
        INSERT INTO public.platform_role_assignments (user_id, project_id, role_id)
        VALUES (?, ?, ?)
        ON CONFLICT (user_id, project_id, role_id) DO NOTHING
      `, [userId, projectId, role]);
    }

    res.status(201).json({ success: true, userId, message: '사용자가 생성되었습니다.' });
  } catch (error) {
    console.error('[USERS POST]', error);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
