// backend/service/church/membership.js
// Church Think - Capability Membership Management Router
// Platform 3.1: Enforces User -> Workspace 1:N Membership approval lifecycle

const express = require('express');
const router = express.Router();
const { query } = require('../../core/db');
const { authenticateToken } = require('../../core/auth');
const { sendNotification } = require('../../core/notification');

async function getActiveProjectId(req) {
  if (req.user && req.user.projectId) return req.user.projectId;
  const fallback = await query.get("SELECT project_id FROM public.platform_projects WHERE service_id = 'church_think' LIMIT 1");
  return fallback ? fallback.project_id : null;
}

// GET /api/church/membership/status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const projectId = await getActiveProjectId(req);

    // Get the workspace corresponding to this project
    const workspace = await query.get(
      "SELECT workspace_id, name FROM public.platform_workspaces WHERE project_id = ? AND capability = 'church' LIMIT 1",
      [projectId]
    );

    if (!workspace) {
      return res.json({ status: 'none' });
    }

    const membership = await query.get(
      "SELECT membership_id, status FROM public.platform_memberships WHERE user_id = ? AND workspace_id = ? LIMIT 1",
      [userId, workspace.workspace_id]
    );

    if (!membership) {
      return res.json({ status: 'none', workspaceId: workspace.workspace_id, churchName: workspace.name });
    }

    res.json({
      status: membership.status,
      membershipId: membership.membership_id,
      workspaceId: workspace.workspace_id,
      churchName: workspace.name
    });
  } catch (error) {
    console.error('[MEMBERSHIP STATUS] Error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/church/membership/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const list = await query.all(`
      SELECT m.membership_id, m.status, m.created_at, w.name as church_name, w.workspace_id
      FROM public.platform_memberships m
      JOIN public.platform_workspaces w ON m.workspace_id = w.workspace_id
      WHERE m.user_id = ? AND m.capability = 'church'
      ORDER BY m.created_at DESC
    `, [userId]);
    res.json(list);
  } catch (error) {
    console.error('[MEMBERSHIP LIST] Error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// POST /api/church/membership/apply
router.post('/apply', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { churchProfileId, workspaceId } = req.body;
    let resolvedWorkspaceId = workspaceId;

    if (!resolvedWorkspaceId && churchProfileId) {
      const church = await query.get('SELECT project_id FROM public.church_profiles WHERE church_id = ?', [churchProfileId]);
      if (church) {
        const workspace = await query.get(
          "SELECT workspace_id FROM public.platform_workspaces WHERE project_id = ? AND capability = 'church' LIMIT 1",
          [church.project_id]
        );
        if (workspace) resolvedWorkspaceId = workspace.workspace_id;
      }
    }

    if (!resolvedWorkspaceId) {
      return res.status(400).json({ message: '소속 교회를 선택해 주세요.' });
    }

    const workspace = await query.get(
      "SELECT workspace_id, project_id, name FROM public.platform_workspaces WHERE workspace_id = ? LIMIT 1",
      [resolvedWorkspaceId]
    );
    if (!workspace) {
      return res.status(404).json({ message: '교회를 찾을 수 없습니다.' });
    }

    // Insert platform membership
    await query.run(`
      INSERT INTO public.platform_memberships (user_id, workspace_id, capability, status)
      VALUES (?, ?, 'church', 'pending')
      ON CONFLICT (user_id, workspace_id) DO UPDATE SET status = 'pending', updated_at = CURRENT_TIMESTAMP
    `, [userId, resolvedWorkspaceId]);

    // Find Church Admins (SYSTEM_ADMIN for this specific project)
    const admins = await query.all(
      "SELECT user_id FROM public.platform_role_assignments WHERE project_id = ? AND (role_id = 'SYSTEM_ADMIN' OR role_id = 'super_admin')",
      [workspace.project_id]
    );

    // Notify Church Admins
    for (const admin of admins) {
      await sendNotification(
        admin.user_id,
        workspace.project_id,
        'new-membership-request',
        `새로운 가입 신청: ${req.user.name || req.user.username}님이 가입 신청을 보냈습니다.`,
        `/settings?tab=users`,
        { workspace_id: resolvedWorkspaceId, capability: 'church' }
      );
    }

    res.json({ success: true, message: '가입 신청이 완료되었습니다. 관리자 승인을 기다려 주세요.' });
  } catch (error) {
    console.error('[MEMBERSHIP APPLY] Error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/church/admin/memberships/pending
router.get('/admin/memberships/pending', authenticateToken, async (req, res) => {
  try {
    const projectId = await getActiveProjectId(req);
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: '교회 관리자 권한이 필요합니다.' });
    }

    const workspace = await query.get(
      "SELECT workspace_id FROM public.platform_workspaces WHERE project_id = ? AND capability = 'church' LIMIT 1",
      [projectId]
    );

    if (!workspace) return res.json([]);

    const pending = await query.all(`
      SELECT m.membership_id, m.created_at, p.user_id, p.display_name, p.username, p.email, p.phone
      FROM public.platform_memberships m
      JOIN public.platform_profiles p ON m.user_id = p.user_id
      WHERE m.workspace_id = ? AND m.status = 'pending'
      ORDER BY m.created_at ASC
    `, [workspace.workspace_id]);

    res.json(pending);
  } catch (error) {
    console.error('[PENDING MEMBERSHIPS] Error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// POST /api/church/admin/memberships/:membershipId/approve
router.post('/admin/memberships/:membershipId/approve', authenticateToken, async (req, res) => {
  try {
    const { membershipId } = req.params;
    const projectId = await getActiveProjectId(req);

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: '교회 관리자 권한이 필요합니다.' });
    }

    // Check membership details
    const membership = await query.get(
      "SELECT user_id, workspace_id, status FROM public.platform_memberships WHERE membership_id = ?",
      [membershipId]
    );

    if (!membership) {
      return res.status(404).json({ message: '가입 신청 내역을 찾을 수 없습니다.' });
    }

    // Ensure this membership belongs to the admin's active workspace
    const workspace = await query.get(
      "SELECT project_id, name FROM public.platform_workspaces WHERE workspace_id = ? LIMIT 1",
      [membership.workspace_id]
    );

    if (!workspace || workspace.project_id !== projectId) {
      return res.status(403).json({ message: '타 교회의 가입 신청을 승인할 권한이 없습니다.' });
    }

    // Update status
    await query.run(
      "UPDATE public.platform_memberships SET status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = ? WHERE membership_id = ?",
      [req.user.userId, membershipId]
    );

    // Assign role to project
    await query.run(`
      INSERT INTO public.platform_role_assignments (user_id, service_id, project_id, role_id)
      VALUES (?, 'church_think', ?, 'user')
      ON CONFLICT DO NOTHING
    `, [membership.user_id, projectId]);

    // Send notification to the user
    await sendNotification(
      membership.user_id,
      projectId,
      'membership-approved',
      `${workspace.name} 교회 가입이 승인되었습니다.`,
      '/app/church',
      { workspace_id: membership.workspace_id, capability: 'church' }
    );

    res.json({ success: true, message: '교회 가입이 승인되었습니다.' });
  } catch (error) {
    console.error('[MEMBERSHIP APPROVE] Error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// POST /api/church/admin/memberships/:membershipId/reject
router.post('/admin/memberships/:membershipId/reject', authenticateToken, async (req, res) => {
  try {
    const { membershipId } = req.params;
    const projectId = await getActiveProjectId(req);

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: '교회 관리자 권한이 필요합니다.' });
    }

    const membership = await query.get(
      "SELECT user_id, workspace_id FROM public.platform_memberships WHERE membership_id = ?",
      [membershipId]
    );

    if (!membership) {
      return res.status(404).json({ message: '가입 신청 내역을 찾을 수 없습니다.' });
    }

    const workspace = await query.get(
      "SELECT project_id, name FROM public.platform_workspaces WHERE workspace_id = ? LIMIT 1",
      [membership.workspace_id]
    );

    if (!workspace || workspace.project_id !== projectId) {
      return res.status(403).json({ message: '타 교회의 가입 신청을 처리할 권한이 없습니다.' });
    }

    // Update status to rejected
    await query.run(
      "UPDATE public.platform_memberships SET status = 'rejected', approved_at = CURRENT_TIMESTAMP, approved_by = ? WHERE membership_id = ?",
      [req.user.userId, membershipId]
    );

    // Send notification
    await sendNotification(
      membership.user_id,
      projectId,
      'membership-rejected',
      `${workspace.name} 교회 가입 신청이 반려되었습니다.`,
      '/app/church',
      { workspace_id: membership.workspace_id, capability: 'church' }
    );

    res.json({ success: true, message: '교회 가입 신청이 반려되었습니다.' });
  } catch (error) {
    console.error('[MEMBERSHIP REJECT] Error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
