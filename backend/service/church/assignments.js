// backend/service/church/assignments.js
// Church Think - User Assignment Router
// Platform 3.1: Capability-isolated assignment APIs under /api/church/assignments

const express = require('express');
const router = express.Router();
const { query } = require('../../core/db');
const { authenticateToken } = require('../../core/auth');
const { sendNotification } = require('../../core/notification');

async function getActiveProjectId(req) {
  if (req.user && req.user.projectId) return req.user.projectId;
  if (req.user && req.user.activeProjectId) return req.user.activeProjectId;
  const fallback = await query.get("SELECT project_id FROM public.platform_projects WHERE service_id = 'church_think' LIMIT 1");
  if (fallback) return fallback.project_id;
  const anyProject = await query.get('SELECT project_id FROM public.platform_projects LIMIT 1');
  return anyProject ? anyProject.project_id : null;
}

async function getChurchId(projectId) {
  const profile = await query.get('SELECT church_id FROM public.church_profiles WHERE project_id = ? LIMIT 1', [projectId]);
  return profile ? profile.church_id : null;
}

const reverseRoleMapping = {
  'SYSTEM_ADMIN': 'system_admin',
  'PASTOR': 'pastor',
  'ELDER': 'elder',
  'FINANCE_MANAGER': 'finance_admin',
  'AUDITOR': 'auditor',
  'COMMITTEE_CHAIR': 'committee_head',
  'GROUP_LEADER': 'department_head',
  'TEACHER': 'teacher',
  'DEPARTMENT_ACCOUNTANT': 'member'
};

async function logAssignmentHistory(projectId, userId, assignmentId, prevAssignment, newAssignment, changeType, changedBy, reason) {
  const churchId = await getChurchId(projectId);
  if (!churchId) return;

  const prevRole = prevAssignment ? (reverseRoleMapping[prevAssignment.role_code] || prevAssignment.role_code) : null;
  const newRole = newAssignment ? (reverseRoleMapping[newAssignment.role_code] || newAssignment.role_code) : null;

  await query.run(`
    INSERT INTO public.church_assignment_history (
      project_id, church_id, user_id, assignment_id,
      previous_committee_id, previous_group_id, previous_position_id, previous_role,
      new_committee_id, new_group_id, new_position_id, new_role,
      change_type, changed_by, reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    projectId, churchId, userId, assignmentId,
    prevAssignment ? prevAssignment.committee_id : null,
    prevAssignment ? prevAssignment.group_id : null,
    prevAssignment ? prevAssignment.position_id : null,
    prevRole,
    newAssignment ? newAssignment.committee_id : null,
    newAssignment ? newAssignment.group_id : null,
    newAssignment ? newAssignment.position_id : null,
    newRole,
    changeType, changedBy, reason
  ]);
}

// GET /api/church/assignments/me — current user's assignments
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const projectId = await getActiveProjectId(req);
    const assignments = await query.all(`
      SELECT 
        a.id, a.committee_id, a.group_id, a.position_id, a.role_code,
        a.is_primary, a.is_active, a.assigned_at, a.status,
        c.name as committee_name,
        g.name as group_name,
        p.name as position_name
      FROM public.church_user_assignments a
      LEFT JOIN public.church_departments c ON a.committee_id = c.department_id
      LEFT JOIN public.church_departments g ON a.group_id = g.department_id
      LEFT JOIN public.church_positions p ON a.position_id = p.position_id
      WHERE a.user_id = ? AND a.project_id = ? AND a.is_active = TRUE
      ORDER BY a.is_primary DESC, a.assigned_at ASC
    `, [userId, projectId]);
    res.json(assignments);
  } catch (error) {
    console.error('[ASSIGNMENTS] Error fetching my assignments:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// POST /api/church/assignments/apply — User requests new assignment
router.post('/apply', authenticateToken, async (req, res) => {
  const { committee_id, group_id, position_id } = req.body;
  const userId = req.user.userId || req.user.id;

  if (!committee_id || !position_id) {
    return res.status(400).json({ message: '위원회와 직책을 선택해 주세요.' });
  }

  try {
    const projectId = await getActiveProjectId(req);

    // Resolve role_code from position
    const pos = await query.get('SELECT role_code, name as position_name FROM public.church_positions WHERE position_id = ?', [position_id]);
    if (!pos) return res.status(404).json({ message: '직책 정보를 찾을 수 없습니다.' });

    // Check if duplicate assignment exists
    const duplicate = await query.get(
      "SELECT id FROM public.church_user_assignments WHERE user_id = ? AND project_id = ? AND committee_id = ? AND COALESCE(group_id, 0) = ? AND position_id = ? AND is_active = TRUE",
      [userId, projectId, committee_id, group_id || 0, position_id]
    );

    if (duplicate) {
      return res.status(400).json({ message: '이미 신청 혹은 배정된 조직 정보입니다.' });
    }

    const result = await query.run(`
      INSERT INTO public.church_user_assignments 
        (user_id, project_id, committee_id, group_id, position_id, role_code, is_primary, is_active, status, assigned_at)
      VALUES (?, ?, ?, ?, ?, ?, FALSE, TRUE, 'pending', CURRENT_TIMESTAMP)
      RETURNING id
    `, [userId, projectId, committee_id, group_id || null, position_id, pos.role_code]);

    // Find Church Admins (SYSTEM_ADMIN for this specific project)
    const admins = await query.all(
      "SELECT user_id FROM public.platform_role_assignments WHERE project_id = ? AND (role_id = 'SYSTEM_ADMIN' OR role_id = 'super_admin')",
      [projectId]
    );

    // Get department/group names for notification message
    const comm = await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [committee_id]);
    const grp = group_id ? await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [group_id]) : null;
    const orgStr = `${comm ? comm.name : ''} ${grp ? '> ' + grp.name : ''} (${pos.position_name})`;

    // Notify Church Admins
    for (const admin of admins) {
      await sendNotification(
        admin.user_id,
        projectId,
        'new-assignment-request',
        `새로운 배정 신청: ${req.user.name}님이 ${orgStr} 배정을 신청했습니다.`,
        `/settings?tab=users`,
        { capability: 'church' }
      );
    }

    res.status(201).json({ success: true, assignmentId: result.id, message: '조직 배정 신청이 접수되었습니다. 관리자 승인을 기다려 주세요.' });
  } catch (error) {
    console.error('[ASSIGNMENTS APPLY] Error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/church/admin/assignments/pending — List all pending assignments (admin only)
router.get('/admin/assignments/pending', authenticateToken, async (req, res) => {
  try {
    const projectId = await getActiveProjectId(req);
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: '교회 관리자 권한이 필요합니다.' });
    }

    const pending = await query.all(`
      SELECT 
        a.id, a.assigned_at, a.status,
        p.user_id, p.display_name, p.username,
        c.name as committee_name,
        g.name as group_name,
        pos.name as position_name
      FROM public.church_user_assignments a
      JOIN public.platform_profiles p ON a.user_id = p.user_id
      LEFT JOIN public.church_departments c ON a.committee_id = c.department_id
      LEFT JOIN public.church_departments g ON a.group_id = g.department_id
      LEFT JOIN public.church_positions pos ON a.position_id = pos.position_id
      WHERE a.project_id = ? AND a.status = 'pending' AND a.is_active = TRUE
      ORDER BY a.assigned_at ASC
    `, [projectId]);

    res.json(pending);
  } catch (error) {
    console.error('[PENDING ASSIGNMENTS] Error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// POST /api/church/admin/assignments/:assignmentId/approve — Approve assignment (admin only)
router.post('/admin/assignments/:assignmentId/approve', authenticateToken, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const projectId = await getActiveProjectId(req);

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: '교회 관리자 권한이 필요합니다.' });
    }

    // Load assignment details
    const assignment = await query.get(
      "SELECT user_id, project_id, committee_id, group_id, position_id, status FROM public.church_user_assignments WHERE id = ? AND is_active = TRUE",
      [assignmentId]
    );

    if (!assignment) {
      return res.status(404).json({ message: '신청 내역을 찾을 수 없습니다.' });
    }

    // Ensure it belongs to the admin's church project
    if (assignment.project_id !== projectId) {
      return res.status(403).json({ message: '타 교회의 조직 신청을 승인할 권한이 없습니다.' });
    }

    // Update assignment status
    await query.run(
      "UPDATE public.church_user_assignments SET status = 'approved' WHERE id = ?",
      [assignmentId]
    );

    // Log to assignment history
    const prevPrimary = await query.get(
      "SELECT * FROM public.church_user_assignments WHERE user_id = ? AND project_id = ? AND is_primary = TRUE AND is_active = TRUE AND id != ?",
      [assignment.user_id, projectId, assignmentId]
    );
    const fullAssignment = await query.get(
      "SELECT * FROM public.church_user_assignments WHERE id = ?",
      [assignmentId]
    );
    await logAssignmentHistory(projectId, assignment.user_id, assignmentId, prevPrimary, fullAssignment, 'approved', req.user.userId || req.user.id, '조직 배정 신청 승인');

    // If it's the first approved assignment, make it primary
    const approvedCount = await query.get(
      "SELECT COUNT(*) as count FROM public.church_user_assignments WHERE user_id = ? AND project_id = ? AND status = 'approved' AND is_active = TRUE",
      [assignment.user_id, projectId]
    );

    if (approvedCount && approvedCount.count === 1) {
      await query.run(
        "UPDATE public.church_user_assignments SET is_primary = TRUE WHERE id = ?",
        [assignmentId]
      );
    }

    // Get names for message
    const comm = await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [assignment.committee_id]);
    const grp = assignment.group_id ? await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [assignment.group_id]) : null;
    const pos = await query.get("SELECT name FROM public.church_positions WHERE position_id = ?", [assignment.position_id]);
    const orgStr = `${comm ? comm.name : ''} ${grp ? '> ' + grp.name : ''} (${pos ? pos.name : ''})`;

    // Notify the user
    await sendNotification(
      assignment.user_id,
      projectId,
      'assignment-approved',
      `조직 배정 신청이 승인되었습니다: ${orgStr}`,
      '/settings',
      { capability: 'church' }
    );

    res.json({ success: true, message: '조직 배정이 승인되었습니다.' });
  } catch (error) {
    console.error('[ASSIGNMENT APPROVE] Error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// POST /api/church/admin/assignments/:assignmentId/reject — Reject assignment (admin only)
router.post('/admin/assignments/:assignmentId/reject', authenticateToken, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const projectId = await getActiveProjectId(req);

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: '교회 관리자 권한이 필요합니다.' });
    }

    // Load assignment details
    const assignment = await query.get(
      "SELECT user_id, project_id, committee_id, group_id, position_id FROM public.church_user_assignments WHERE id = ? AND is_active = TRUE",
      [assignmentId]
    );

    if (!assignment) {
      return res.status(404).json({ message: '신청 내역을 찾을 수 없습니다.' });
    }

    if (assignment.project_id !== projectId) {
      return res.status(403).json({ message: '타 교회의 조직 신청을 처리할 권한이 없습니다.' });
    }

    // Update status to rejected
    await query.run(
      "UPDATE public.church_user_assignments SET status = 'rejected' WHERE id = ?",
      [assignmentId]
    );

    // Get names for message
    const comm = await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [assignment.committee_id]);
    const grp = assignment.group_id ? await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [assignment.group_id]) : null;
    const pos = await query.get("SELECT name FROM public.church_positions WHERE position_id = ?", [assignment.position_id]);
    const orgStr = `${comm ? comm.name : ''} ${grp ? '> ' + grp.name : ''} (${pos ? pos.name : ''})`;

    // Notify the user
    await sendNotification(
      assignment.user_id,
      projectId,
      'assignment-rejected',
      `조직 배정 신청이 반려되었습니다: ${orgStr}`,
      '/settings',
      { capability: 'church' }
    );

    res.json({ success: true, message: '조직 배정 신청이 반려되었습니다.' });
  } catch (error) {
    console.error('[ASSIGNMENT REJECT] Error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/church/assignments/users/:id — specific user's assignments (admin only)
router.get('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const projectId = await getActiveProjectId(req);
    const assignments = await query.all(`
      SELECT 
        a.id, a.committee_id, a.group_id, a.position_id, a.role_code,
        a.is_primary, a.is_active, a.assigned_at, a.status,
        c.name as committee_name,
        g.name as group_name,
        p.name as position_name
      FROM public.church_user_assignments a
      LEFT JOIN public.church_departments c ON a.committee_id = c.department_id
      LEFT JOIN public.church_departments g ON a.group_id = g.department_id
      LEFT JOIN public.church_positions p ON a.position_id = p.position_id
      WHERE a.user_id = ? AND a.project_id = ? AND a.is_active = TRUE
      ORDER BY a.is_primary DESC, a.assigned_at ASC
    `, [id, projectId]);
    res.json(assignments);
  } catch (error) {
    console.error('[ASSIGNMENTS] Error fetching user assignments:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// POST /api/church/assignments/users/:id — create assignment (admin only)
router.post('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { committee_id, group_id, position_id, role_code, is_primary } = req.body;
  if (!position_id && !role_code) return res.status(400).json({ message: '직책 또는 역할 코드가 필요합니다.' });
  try {
    const projectId = await getActiveProjectId(req);
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: '교회 관리자 권한이 필요합니다.' });
    }

    // Resolve role_code from position if not provided
    let resolvedRoleCode = role_code;
    if (position_id && !resolvedRoleCode) {
      const pos = await query.get('SELECT role_code FROM public.church_positions WHERE position_id = ?', [position_id]);
      if (pos) resolvedRoleCode = pos.role_code;
    }
    // If is_primary, unset other primary assignments
    if (is_primary) {
      await query.run(
        'UPDATE public.church_user_assignments SET is_primary = FALSE WHERE user_id = ? AND project_id = ?',
        [id, projectId]
      );
    }
    const result = await query.run(`
      INSERT INTO public.church_user_assignments 
        (user_id, project_id, committee_id, group_id, position_id, role_code, is_primary, is_active, status, assigned_at, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, 'approved', CURRENT_TIMESTAMP, 'manual')
      RETURNING id
    `, [id, projectId, committee_id || null, group_id || null, position_id || null, resolvedRoleCode, is_primary ? true : false]);

    const prevPrimary = await query.get(
      "SELECT * FROM public.church_user_assignments WHERE user_id = ? AND project_id = ? AND is_primary = TRUE AND is_active = TRUE AND id != ?",
      [id, projectId, result.id]
    );
    const newAssign = { committee_id, group_id, position_id, role_code: resolvedRoleCode };
    await logAssignmentHistory(projectId, id, result.id, prevPrimary, newAssign, 'approved', req.user.userId || req.user.id, '관리자에 의한 직접 배정');

    res.status(201).json({ success: true, assignment: { id: result.id }, message: '배정이 완료되었습니다.' });
  } catch (err) {
    console.error('[ASSIGNMENTS] Error creating assignment:', err);
    res.status(500).json({ success: false, message: '배정 중 오류가 발생했습니다.', details: err.message });
  }
});

// DELETE /api/church/assignments/users/:id/:assignmentId — remove assignment (admin only)
router.delete('/users/:id/:assignmentId', authenticateToken, async (req, res) => {
  const { id, assignmentId } = req.params;
  try {
    const projectId = await getActiveProjectId(req);
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: '교회 관리자 권한이 필요합니다.' });
    }

    const assignment = await query.get(
      "SELECT * FROM public.church_user_assignments WHERE id = ? AND user_id = ? AND project_id = ? AND is_active = TRUE",
      [assignmentId, id, projectId]
    );
    if (assignment) {
      await logAssignmentHistory(projectId, id, assignmentId, assignment, null, 'ended', req.user.userId || req.user.id, '관리자에 의한 배정 해제');
    }

    await query.run(
      'UPDATE public.church_user_assignments SET is_active = FALSE, ended_by = ?, ended_at = CURRENT_TIMESTAMP, end_reason = ? WHERE id = ? AND user_id = ? AND project_id = ?',
      [req.user.userId || req.user.id, '관리자에 의한 배정 해제', assignmentId, id, projectId]
    );
    res.json({ message: '배정이 해제되었습니다.' });
  } catch (error) {
    console.error('[ASSIGNMENTS] Error removing assignment:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
