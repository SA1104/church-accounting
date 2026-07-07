// backend/service/church/users.js
// Church Think - User Management API

const express = require('express');
const router = express.Router();
const { query, supabase } = require('../../core/db');
const { authenticateToken, requireRole } = require('../../core/auth');
const bcrypt = require('bcryptjs');

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

router.post('/', authenticateToken, requireRole(['SYSTEM_ADMIN']), async (req, res) => {
  console.log('1. request url:', req.originalUrl);
  console.log('2. request body:', req.body);
  console.log('3. authenticated user:', req.user?.username);
  console.log('4. authenticated role:', req.user?.roles?.platform);
  console.log('5. middleware result: Passed requireRole');

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
      console.log('7. SQL error:', authError);
      console.log('8. response status:', 400);
      console.log('9. response body:', { message: '사용자 생성에 실패했습니다 (Auth).', details: authError.message });
      return res.status(400).json({ message: '사용자 생성에 실패했습니다 (Auth).', details: authError.message });
    }

    const userId = authData.user.id;

    // Platform profile
    const sql1 = `
      INSERT INTO public.platform_profiles (user_id, username, display_name, phone)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (user_id) DO UPDATE SET username = EXCLUDED.username, display_name = EXCLUDED.display_name, phone = EXCLUDED.phone
    `;
    console.log('6. SQL executed:', sql1, [userId, username, name, phone || null]);
    await query.run(sql1, [userId, username, name, phone || null]);

    // Platform membership
    const sql2 = `
      INSERT INTO public.platform_memberships (user_id, project_id, is_active)
      VALUES (?, ?, TRUE)
      ON CONFLICT (user_id, project_id) DO NOTHING
    `;
    console.log('6. SQL executed:', sql2, [userId, projectId]);
    await query.run(sql2, [userId, projectId]);

    // Role
    if (role) {
      const sql3 = `
        INSERT INTO public.platform_role_assignments (user_id, project_id, role_id)
        VALUES (?, ?, ?)
        ON CONFLICT (user_id, project_id, role_id) DO NOTHING
      `;
      console.log('6. SQL executed:', sql3, [userId, projectId, role]);
      await query.run(sql3, [userId, projectId, role]);
    }

    console.log('8. response status:', 201);
    console.log('9. response body:', { success: true, message: '사용자가 생성되었습니다.', userId });
    res.status(201).json({ success: true, message: '사용자가 생성되었습니다.', userId });
  } catch (error) {
    console.log('7. SQL error:', error);
    console.log('8. response status:', 500);
    console.log('9. response body:', { message: error.message });
    res.status(500).json({ message: error.message });
  }
});

// GET /api/church/users/:id/assignments
router.get('/:id/assignments', authenticateToken, async (req, res) => {
  try {
    const projectId = await getActiveProjectId(req);
    const assignments = await query.all(`
      SELECT a.*, c.name as committee_name, g.name as group_name, p.name as position_name
      FROM public.church_user_assignments a
      LEFT JOIN public.church_departments c ON a.committee_id = c.department_id
      LEFT JOIN public.church_departments g ON a.group_id = g.department_id
      LEFT JOIN public.church_positions p ON a.position_id = p.position_id
      WHERE a.user_id = ? AND a.project_id = ?
      ORDER BY a.is_primary DESC, a.is_active DESC, a.assigned_at DESC
    `, [req.params.id, projectId]);
    res.json(assignments || []);
  } catch (error) {
    console.error('[ASSIGNMENTS GET]', error);
    res.status(500).json({ message: 'DB Error' });
  }
});

// POST /api/church/users/:id/assignments
router.post('/:id/assignments', authenticateToken, async (req, res) => {
  try {
    const { committee_id, group_id, position_id, role_code } = req.body;
    const projectId = await getActiveProjectId(req);

    if (!committee_id || !position_id || !role_code) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if active duplicate exists in the same group/committee
    const duplicate = await query.get(`
      SELECT id FROM public.church_user_assignments
      WHERE user_id = ? AND project_id = ? AND committee_id = ? AND COALESCE(group_id, -1) = COALESCE(?, -1) AND is_active = TRUE
    `, [req.params.id, projectId, committee_id, group_id]);

    if (duplicate) {
      // Inactivate existing assignment to preserve history
      await query.run(`
        UPDATE public.church_user_assignments
        SET is_active = FALSE, revoked_at = CURRENT_TIMESTAMP, revoked_by = ?
        WHERE id = ?
      `, [req.user.userId, duplicate.id]);
    }

    // Insert new assignment
    const result = await query.run(`
      INSERT INTO public.church_user_assignments (user_id, project_id, committee_id, group_id, position_id, role_code, is_active, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, 'approved')
    `, [req.params.id, projectId, committee_id, group_id || null, position_id, role_code, req.user.userId]);
    
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, project_id, action, details, ip_address, result)
      VALUES (?, ?, 'USER_ASSIGNMENT_CREATE', ?, ?, 'SUCCESS')
    `, [req.user.userId, projectId, JSON.stringify({ target: req.params.id, committee_id, group_id, role_code }), req.ip || '']);
    
    res.status(201).json({ success: true, id: result.id });
  } catch (err) {
    console.error('[Add Assignment Error]', err);
    res.status(500).json({ message: 'DB Error' });
  }
});

// PATCH /api/church/users/:id/assignments/:assignmentId/inactive
router.patch('/:id/assignments/:assignmentId/inactive', authenticateToken, async (req, res) => {
  try {
    const projectId = await getActiveProjectId(req);
    await query.run(`
      UPDATE public.church_user_assignments 
      SET is_active = FALSE, revoked_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ? AND project_id = ?
    `, [req.params.assignmentId, req.params.id, projectId]);
    
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, project_id, action, details, ip_address, result)
      VALUES (?, ?, 'USER_ASSIGNMENT_INACTIVE', ?, ?, 'SUCCESS')
    `, [req.user.userId, projectId, JSON.stringify({ target: req.params.id, assignment_id: req.params.assignmentId }), req.ip || '']);
    
    res.json({ success: true });
  } catch (error) {
    console.error('[ASSIGNMENTS INACTIVE]', error);
    res.status(500).json({ message: 'DB Error' });
  }
});

// PATCH /api/church/users/:id/assignments/:assignmentId/primary
router.patch('/:id/assignments/:assignmentId/primary', authenticateToken, async (req, res) => {
  try {
    const projectId = await getActiveProjectId(req);
    
    // Unset current primary
    await query.run(`
      UPDATE public.church_user_assignments SET is_primary = FALSE 
      WHERE user_id = ? AND project_id = ?
    `, [req.params.id, projectId]);
    
    // Set new primary
    await query.run(`
      UPDATE public.church_user_assignments SET is_primary = TRUE 
      WHERE id = ? AND user_id = ? AND project_id = ?
    `, [req.params.assignmentId, req.params.id, projectId]);
    
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, project_id, action, details, ip_address, result)
      VALUES (?, ?, 'USER_ASSIGNMENT_PRIMARY', ?, ?, 'SUCCESS')
    `, [req.user.userId, projectId, JSON.stringify({ target: req.params.id, assignment_id: req.params.assignmentId }), req.ip || '']);
    
    res.json({ success: true });
  } catch (error) {
    console.error('[ASSIGNMENTS PRIMARY]', error);
    res.status(500).json({ message: 'DB Error' });
  }
});

module.exports = router;
