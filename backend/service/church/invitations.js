// backend/service/church/invitations.js
// Church Think - Invitation Management Router (Platform 3.1)
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../../core/db');
const { authenticateToken } = require('../../core/auth');

async function getActiveProjectId(req) {
  if (req.user && req.user.projectId) return req.user.projectId;
  if (req.user && req.user.activeProjectId) return req.user.activeProjectId;
  const fallback = await query.get("SELECT project_id FROM public.platform_projects WHERE service_id = 'church_think' LIMIT 1");
  return fallback ? fallback.project_id : null;
}

async function getChurchId(projectId) {
  const profile = await query.get('SELECT church_name, church_id FROM public.church_profiles WHERE project_id = ? LIMIT 1', [projectId]);
  return profile ? profile.church_id : null;
}

// Map standardized role keys to DB role_codes
const roleMapping = {
  'system_admin': 'SYSTEM_ADMIN',
  'pastor': 'PASTOR',
  'elder': 'ELDER',
  'finance_admin': 'FINANCE_MANAGER',
  'auditor': 'AUDITOR',
  'committee_head': 'COMMITTEE_CHAIR',
  'department_head': 'GROUP_LEADER',
  'teacher': 'TEACHER',
  'member': 'DEPARTMENT_ACCOUNTANT'
};

function getStandardizedRole(req) {
  if (req.user.isAdmin) return 'system_admin';
  const role = req.user.roles?.church_think || req.user.roles?.accounting || 'member';
  if (role === 'super_admin' || role === 'SYSTEM_ADMIN') return 'system_admin';
  if (role === 'PASTOR') return 'pastor';
  if (role === 'ELDER') return 'elder';
  if (role === 'FINANCE_MANAGER') return 'finance_admin';
  if (role === 'AUDITOR') return 'auditor';
  if (role === 'COMMITTEE_CHAIR') return 'committee_head';
  if (role === 'GROUP_LEADER') return 'department_head';
  if (role === 'TEACHER') return 'teacher';
  return 'member';
}

async function checkInvitePermission(req, committeeId, groupId) {
  const stdRole = getStandardizedRole(req);
  if (['system_admin', 'pastor', 'elder', 'finance_admin'].includes(stdRole)) {
    return true;
  }

  if (stdRole === 'committee_head') {
    const activeContext = req.user.accounting?.activeContext;
    if (activeContext && activeContext.committeeId === parseInt(committeeId, 10)) {
      return true;
    }
  }

  if (stdRole === 'department_head' && groupId) {
    const activeContext = req.user.accounting?.activeContext;
    if (activeContext && activeContext.groupId === parseInt(groupId, 10)) {
      return true;
    }
  }

  return false;
}

// 1. Create Invitation
router.post('/', authenticateToken, async (req, res) => {
  const { email, name, phone, committee_id, group_id, position_id, role, message, expires_in_days } = req.body;
  const userId = req.user.userId || req.user.id;

  if (!email || !name || !committee_id || !position_id || !role) {
    return res.status(400).json({ message: '필수 입력 항목(이메일, 이름, 위원회, 직책, 역할)이 누락되었습니다.' });
  }

  try {
    const projectId = await getActiveProjectId(req);
    const churchId = await getChurchId(projectId);
    if (!churchId) {
      return res.status(404).json({ message: '소속 교회를 찾을 수 없습니다.' });
    }

    const hasPermission = await checkInvitePermission(req, committee_id, group_id);
    if (!hasPermission) {
      return res.status(403).json({ message: '해당 부서/그룹에 사용자를 초대할 권한이 없습니다.' });
    }

    // Check duplicate pending invitations
    const existing = await query.get(
      "SELECT id FROM public.church_invitations WHERE invited_email = ? AND project_id = ? AND status = 'pending'",
      [email, projectId]
    );
    if (existing) {
      return res.status(400).json({ message: '해당 이메일로 발송된 미완료 초대장이 이미 존재합니다.' });
    }

    // Generate token and expiration
    const token = crypto.randomBytes(32).toString('hex');
    const days = parseInt(expires_in_days || 7, 10);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const result = await query.run(`
      INSERT INTO public.church_invitations (
        project_id, church_id, invited_email, invited_phone, invited_name,
        committee_id, group_id, position_id, role, invitation_token,
        status, invited_by, expires_at, message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
      RETURNING id
    `, [
      projectId, churchId, email, phone || null, name,
      parseInt(committee_id, 10), group_id ? parseInt(group_id, 10) : null,
      position_id, role, token, userId, expiresAt, message || null
    ]);

    // Log to assignment history (invited)
    await query.run(`
      INSERT INTO public.church_assignment_history (
        project_id, church_id, user_id, new_committee_id, new_group_id,
        new_position_id, new_role, change_type, changed_by, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'invited', ?, ?)
    `, [
      projectId, churchId, '00000000-0000-0000-0000-000000000000', // Empty placeholder user since account may not exist yet
      parseInt(committee_id, 10), group_id ? parseInt(group_id, 10) : null,
      position_id, role, userId, '초대장 발송'
    ]);

    res.status(201).json({
      success: true,
      invitation_id: result.id,
      token,
      expires_at: expiresAt
    });
  } catch (err) {
    console.error('[INVITATIONS] Create error:', err);
    res.status(500).json({ message: '초대장 생성 중 데이터베이스 오류가 발생했습니다.' });
  }
});

// 6. Fetch User Assignment History
router.get('/history', authenticateToken, async (req, res) => {
  const targetUserId = req.query.user_id || req.user.userId || req.user.id;

  try {
    const projectId = await getActiveProjectId(req);
    const list = await query.all(
      "SELECT * FROM public.church_assignment_history WHERE user_id = ? AND project_id = ? ORDER BY created_at DESC",
      [targetUserId, projectId]
    );

    const resolved = [];
    for (const item of list) {
      const prevCommittee = item.previous_committee_id ? await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [item.previous_committee_id]) : null;
      const prevGroup = item.previous_group_id ? await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [item.previous_group_id]) : null;
      const prevPosition = item.previous_position_id ? await query.get("SELECT name FROM public.church_positions WHERE position_id = ?", [item.previous_position_id]) : null;

      const newCommittee = item.new_committee_id ? await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [item.new_committee_id]) : null;
      const newGroup = item.new_group_id ? await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [item.new_group_id]) : null;
      const newPosition = item.new_position_id ? await query.get("SELECT name FROM public.church_positions WHERE position_id = ?", [item.new_position_id]) : null;

      const changer = await query.get("SELECT display_name FROM public.platform_profiles WHERE user_id = ?", [item.changed_by]);

      resolved.push({
        ...item,
        prev_committee_name: prevCommittee ? prevCommittee.name : null,
        prev_group_name: prevGroup ? prevGroup.name : null,
        prev_position_name: prevPosition ? prevPosition.name : null,
        new_committee_name: newCommittee ? newCommittee.name : null,
        new_group_name: newGroup ? newGroup.name : null,
        new_position_name: newPosition ? newPosition.name : null,
        changer_name: changer ? changer.display_name : '시스템'
      });
    }

    res.json(resolved);
  } catch (err) {
    console.error('[ASSIGNMENTS] Fetch history error:', err);
    res.status(500).json({ message: '이력 조회 중 오류가 발생했습니다.' });
  }
});

// 2. Fetch Invitation details (Public)
router.get('/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const invite = await query.get(
      "SELECT * FROM public.church_invitations WHERE invitation_token = ?",
      [token]
    );

    if (!invite) {
      return res.status(404).json({ message: '유효하지 않은 초대 링크입니다.' });
    }

    if (invite.status === 'revoked') {
      return res.status(400).json({ message: '취소된 초대 링크입니다.' });
    }

    if (invite.status === 'accepted') {
      return res.status(400).json({ message: '이미 수락 완료된 초대 링크입니다.' });
    }

    // Check expiration
    if (new Date(invite.expires_at) < new Date()) {
      await query.run("UPDATE public.church_invitations SET status = 'expired' WHERE id = ?", [invite.id]);
      return res.status(410).json({ message: '만료된 초대 링크입니다.' });
    }

    // Resolve details
    const church = await query.get("SELECT church_name FROM public.church_profiles WHERE church_id = ?", [invite.church_id]);
    const committee = await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [invite.committee_id]);
    const group = invite.group_id ? await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [invite.group_id]) : null;
    const position = await query.get("SELECT name FROM public.church_positions WHERE position_id = ?", [invite.position_id]);
    const inviter = await query.get("SELECT display_name FROM public.platform_profiles WHERE user_id = ?", [invite.invited_by]);

    const account = await query.get("SELECT user_id FROM public.platform_profiles WHERE email = ?", [invite.invited_email]);

    res.json({
      id: invite.id,
      invited_name: invite.invited_name,
      invited_email: invite.invited_email,
      invited_phone: invite.invited_phone,
      church_name: church ? church.church_name : '알 수 없는 교회',
      committee_name: committee ? committee.name : '알 수 없는 위원회',
      group_name: group ? group.name : null,
      position_name: position ? position.name : '알 수 없는 직책',
      role: invite.role,
      inviter_name: inviter ? inviter.display_name : '관리자',
      expires_at: invite.expires_at,
      message: invite.message,
      accountExists: !!account
    });
  } catch (err) {
    console.error('[INVITATIONS] Fetch details error:', err);
    res.status(500).json({ message: '초대장 조회 중 오류가 발생했습니다.' });
  }
});

// 3. Accept Invitation (Auth required)
router.post('/:token/accept', authenticateToken, async (req, res) => {
  const { token } = req.params;
  const userId = req.user.userId || req.user.id;

  try {
    const invite = await query.get(
      "SELECT * FROM public.church_invitations WHERE invitation_token = ?",
      [token]
    );

    if (!invite || invite.status !== 'pending') {
      return res.status(400).json({ message: '수락할 수 없는 초대장이거나 이미 완료되었습니다.' });
    }

    if (new Date(invite.expires_at) < new Date()) {
      await query.run("UPDATE public.church_invitations SET status = 'expired' WHERE id = ?", [invite.id]);
      return res.status(400).json({ message: '만료된 초대 링크입니다.' });
    }

    // Security check: email validation
    if (req.user.email !== invite.invited_email) {
      return res.status(403).json({ message: '초대장 수신자 이메일과 현재 로그인 이메일이 일치하지 않습니다.' });
    }

    // Resolve workspace to join
    const workspace = await query.get(
      "SELECT workspace_id FROM public.platform_workspaces WHERE project_id = ? AND capability = 'church' LIMIT 1",
      [invite.project_id]
    );
    if (!workspace) {
      return res.status(404).json({ message: '가입할 교회 워크스페이스를 찾을 수 없습니다.' });
    }

    const dbRoleCode = roleMapping[invite.role] || 'DEPARTMENT_ACCOUNTANT';

    // ATOMIC TRANSACTION SEQUENCE (SQLite local transaction emulation)
    await query.exec("BEGIN TRANSACTION");
    try {
      // 1. Create or update platform membership
      await query.run(`
        INSERT INTO public.platform_memberships (user_id, workspace_id, capability, status, approved_at, approved_by)
        VALUES (?, ?, 'church', 'approved', CURRENT_TIMESTAMP, ?)
        ON CONFLICT (user_id, workspace_id) DO UPDATE SET status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = ?
      `, [userId, workspace.workspace_id, invite.invited_by, invite.invited_by]);

      // 2. Clear any existing active primary assignments in this project
      await query.run(
        "UPDATE public.church_user_assignments SET is_primary = FALSE WHERE user_id = ? AND project_id = ?",
        [userId, invite.project_id]
      );

      // 3. Create active assignment
      const assignmentResult = await query.run(`
        INSERT INTO public.church_user_assignments (
          user_id, project_id, committee_id, group_id, position_id, role_code,
          is_primary, is_active, status, approved_by, approved_at, source
        ) VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE, 'approved', ?, CURRENT_TIMESTAMP, 'invitation')
        RETURNING id
      `, [
        userId, invite.project_id, invite.committee_id, invite.group_id,
        invite.position_id, dbRoleCode, invite.invited_by
      ]);

      // Resolve membership_id
      const memb = await query.get(
        "SELECT membership_id FROM public.platform_memberships WHERE user_id = ? AND workspace_id = ? LIMIT 1",
        [userId, workspace.workspace_id]
      );

      // 4. Log to assignment history (accepted)
      await query.run(`
        INSERT INTO public.church_assignment_history (
          project_id, church_id, user_id, membership_id, assignment_id,
          new_committee_id, new_group_id, new_position_id, new_role,
          change_type, changed_by, reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'accepted', ?, '초대 수락 및 자동 부서 배정')
      `, [
        invite.project_id, invite.church_id, userId, memb ? memb.membership_id : null,
        assignmentResult.id, invite.committee_id, invite.group_id,
        invite.position_id, invite.role, userId
      ]);

      // 5. Update invitation status to accepted
      await query.run(`
        UPDATE public.church_invitations
        SET status = 'accepted', accepted_by = ?, accepted_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [userId, invite.id]);

      // 6. Assign church role in platform_role_assignments
      await query.run(`
        INSERT INTO public.platform_role_assignments (user_id, service_id, project_id, role_id)
        VALUES (?, 'church_think', ?, ?)
        ON CONFLICT DO NOTHING
      `, [userId, invite.project_id, invite.role === 'system_admin' ? 'admin' : 'user']);

      await query.exec("COMMIT");
    } catch (txErr) {
      await query.exec("ROLLBACK");
      throw txErr;
    }

    res.json({ success: true, message: '초대를 수락하고 교회에 소속 및 직책 배정이 완료되었습니다.' });
  } catch (err) {
    console.error('[INVITATIONS] Accept error:', err);
    res.status(500).json({ message: '초대 수락 작업 처리 중 데이터베이스 오류가 발생했습니다.' });
  }
});

// 4. Revoke Invitation
router.post('/:id/revoke', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId || req.user.id;

  try {
    const invite = await query.get("SELECT * FROM public.church_invitations WHERE id = ?", [id]);
    if (!invite) {
      return res.status(404).json({ message: '초대장을 찾을 수 없습니다.' });
    }

    const stdRole = getStandardizedRole(req);
    const isOwner = invite.invited_by === userId;
    const isAdmin = ['system_admin', 'pastor', 'elder', 'finance_admin'].includes(stdRole);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: '이 초대를 취소할 권한이 없습니다.' });
    }

    await query.run(
      "UPDATE public.church_invitations SET status = 'revoked', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    // Log to assignment history (revoked)
    await query.run(`
      INSERT INTO public.church_assignment_history (
        project_id, church_id, user_id, new_committee_id, new_group_id,
        new_position_id, new_role, change_type, changed_by, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'revoked', ?, '초대 취소됨')
    `, [
      invite.project_id, invite.church_id, '00000000-0000-0000-0000-000000000000',
      invite.committee_id, invite.group_id, invite.position_id, invite.role, userId
    ]);

    res.json({ success: true, message: '초대 링크가 폐기되었습니다.' });
  } catch (err) {
    console.error('[INVITATIONS] Revoke error:', err);
    res.status(500).json({ message: '초대 취소 중 오류가 발생했습니다.' });
  }
});

// 5. List Invitations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projectId = await getActiveProjectId(req);
    const stdRole = getStandardizedRole(req);
    let list;

    if (['system_admin', 'pastor', 'elder', 'finance_admin', 'auditor'].includes(stdRole)) {
      list = await query.all(
        "SELECT * FROM public.church_invitations WHERE project_id = ? ORDER BY created_at DESC",
        [projectId]
      );
    } else if (stdRole === 'committee_head') {
      const activeContext = req.user.accounting?.activeContext;
      list = await query.all(
        "SELECT * FROM public.church_invitations WHERE project_id = ? AND committee_id = ? ORDER BY created_at DESC",
        [projectId, activeContext ? activeContext.committeeId : 0]
      );
    } else if (stdRole === 'department_head') {
      const activeContext = req.user.accounting?.activeContext;
      list = await query.all(
        "SELECT * FROM public.church_invitations WHERE project_id = ? AND group_id = ? ORDER BY created_at DESC",
        [projectId, activeContext ? activeContext.groupId : 0]
      );
    } else {
      list = [];
    }

    // Resolve visual names
    const resolved = [];
    for (const item of list) {
      const committee = await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [item.committee_id]);
      const group = item.group_id ? await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [item.group_id]) : null;
      const position = await query.get("SELECT name FROM public.church_positions WHERE position_id = ?", [item.position_id]);
      const inviter = await query.get("SELECT display_name FROM public.platform_profiles WHERE user_id = ?", [item.invited_by]);

      resolved.push({
        ...item,
        committee_name: committee ? committee.name : '알 수 없는 위원회',
        group_name: group ? group.name : null,
        position_name: position ? position.name : '알 수 없는 직책',
        inviter_name: inviter ? inviter.display_name : '관리자'
      });
    }

    res.json(resolved);
  } catch (err) {
    console.error('[INVITATIONS] List error:', err);
    res.status(500).json({ message: '초대 목록 조회 중 데이터베이스 오류가 발생했습니다.' });
  }
});

module.exports = router;
