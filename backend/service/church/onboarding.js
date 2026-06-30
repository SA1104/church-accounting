// backend/service/church/onboarding.js
// Church Think - Onboarding Router
// Platform 3.1: Called AFTER Platform signup completes

const express = require('express');
const router = express.Router();
const { query } = require('../../core/db');
const { sendNotification } = require('../../core/notification');

// POST /api/church/onboarding
router.post('/', async (req, res) => {
  const { churchProfileId, departmentId, groupId, signature, requested_assignments, customDepartmentName, customGroupName, churchCreateRequest, userId: bodyUserId } = req.body;
  const userId = bodyUserId || (req.user && (req.user.userId || req.user.id));

  if (!userId) {
    return res.status(400).json({ message: 'User ID가 제공되지 않았습니다.' });
  }

  try {
    let projectId = null;
    let assignedDeptId = departmentId ? parseInt(departmentId, 10) : null;
    let signupStatus = 'pending_approval';
    let workspaceId = null;

    if (churchCreateRequest) {
      // Flow A: Request new church workspace (Auto approved as owner)
      signupStatus = 'approved';
      const newChurchId = require('crypto').randomUUID();
      const newProjectId = require('crypto').randomUUID();
      const { churchName, denomination, region, address, managerName } = churchCreateRequest;

      await query.run(`
        INSERT INTO public.church_profiles (church_id, project_id, church_name, denomination, region, manager_name)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [newChurchId, newProjectId, churchName, denomination || '', region || '', managerName || '교회 관리자']);

      await query.run(`
        INSERT INTO public.platform_projects (project_id, org_id, service_id, project_name, status)
        VALUES (?, 'd7a049e0-06b2-4d26-8809-17be7bf6e491', 'church_think', ?, 'ACTIVE')
      `, [newProjectId, churchName]);

      // Create default committees
      const defaultCommittees = ['재정위원회', '예배위원회', '선교위원회', '교육위원회', '관리위원회'];
      let firstDeptId = null;
      for (const deptName of defaultCommittees) {
        const r = await query.run(
          'INSERT INTO public.church_departments (project_id, parent_id, name, is_active) VALUES (?, NULL, ?, TRUE) RETURNING department_id',
          [newProjectId, deptName]
        );
        if (!firstDeptId) firstDeptId = r.id;
      }
      assignedDeptId = firstDeptId;
      projectId = newProjectId;

      // Register workspace in platform_workspaces
      const wsResult = await query.run(
        'INSERT INTO public.platform_workspaces (capability, name, project_id, is_active) VALUES (?, ?, ?, TRUE) RETURNING workspace_id',
        ['church', churchName, newProjectId]
      );
      workspaceId = wsResult.id;

      // Insert platform memberships as approved for the creator/owner
      await query.run(`
        INSERT INTO public.platform_memberships (user_id, workspace_id, capability, status, approved_at)
        VALUES (?, ?, 'church', 'approved', CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, workspace_id) DO UPDATE SET status = 'approved', approved_at = CURRENT_TIMESTAMP
      `, [userId, workspaceId]);

      // Set platform role as SYSTEM_ADMIN for this project
      await query.run(
        `INSERT INTO public.platform_role_assignments (user_id, service_id, project_id, role_id) VALUES (?, 'church_think', ?, 'SYSTEM_ADMIN') ON CONFLICT DO NOTHING`,
        [userId, projectId]
      );

      // Create approved default position (위원장)
      const positions = [
        { name: '회계', role_code: 'DEPARTMENT_ACCOUNTANT' },
        { name: '총무', role_code: 'FINANCE_MANAGER' },
        { name: '부장', role_code: 'GROUP_LEADER' },
        { name: '위원장', role_code: 'COMMITTEE_CHAIR' },
        { name: '교역자', role_code: 'PASTOR' }
      ];
      let chairPosId = null;
      for (const pos of positions) {
        const r = await query.run(`
          INSERT INTO public.church_positions (project_id, name, role_code)
          VALUES (?, ?, ?)
          ON CONFLICT (project_id, name) DO UPDATE SET role_code = EXCLUDED.role_code
          RETURNING position_id
        `, [projectId, pos.name, pos.role_code]);
        if (pos.name === '위원장') chairPosId = r.id;
      }

      // Add default approved assignment as COMMITTEE_CHAIR (위원장)
      await query.run(`
        INSERT INTO public.church_user_assignments
          (user_id, project_id, committee_id, group_id, position_id, role_code, is_primary, is_active, status, assigned_at)
        VALUES (?, ?, ?, NULL, ?, 'COMMITTEE_CHAIR', TRUE, TRUE, 'approved', CURRENT_TIMESTAMP)
      `, [userId, projectId, assignedDeptId, chairPosId]);

    } else {
      // Flow B: Join existing church workspace
      if (!churchProfileId) return res.status(400).json({ message: '소속 교회를 선택해 주세요.' });
      const church = await query.get('SELECT project_id, church_name FROM public.church_profiles WHERE church_id = ?', [churchProfileId]);
      if (!church) return res.status(404).json({ message: '교회를 찾을 수 없습니다.' });
      projectId = church.project_id;

      // Get workspace
      const workspace = await query.get(
        "SELECT workspace_id FROM public.platform_workspaces WHERE project_id = ? AND capability = 'church' LIMIT 1",
        [projectId]
      );
      workspaceId = workspace ? workspace.workspace_id : null;

      if (!workspaceId) {
        return res.status(404).json({ message: '교회 워크스페이스를 찾을 수 없습니다.' });
      }

      // Create pending platform membership
      await query.run(`
        INSERT INTO public.platform_memberships (user_id, workspace_id, capability, status)
        VALUES (?, ?, 'church', 'pending')
        ON CONFLICT (user_id, workspace_id) DO UPDATE SET status = 'pending', updated_at = CURRENT_TIMESTAMP
      `, [userId, workspaceId]);

      // Save requested assignments
      if (Array.isArray(requested_assignments) && requested_assignments.length > 0) {
        for (const a of requested_assignments) {
          await query.run(`
            INSERT INTO public.church_signup_assignment_requests
              (user_id, project_id, committee_id, group_id, position_id, requested_position_name, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
          `, [userId, projectId,
              a.committee_id ? parseInt(a.committee_id, 10) : null,
              a.group_id ? parseInt(a.group_id, 10) : null,
              a.position_id || null,
              a.requested_position_name || null]);
        }
      }

      // Notify Church Admins
      const admins = await query.all(
        "SELECT user_id FROM public.platform_role_assignments WHERE project_id = ? AND (role_id = 'SYSTEM_ADMIN' OR role_id = 'super_admin')",
        [projectId]
      );

      for (const admin of admins) {
        await sendNotification(
          admin.user_id,
          projectId,
          'new-membership-request',
          `새로운 교회 가입 신청: ${req.body.name || '신규 사용자'}님이 ${church.church_name} 가입을 신청했습니다.`,
          `/settings?tab=users`,
          { workspace_id: workspaceId, capability: 'church' }
        );
      }
    }

    // Upsert church_user_metadata
    await query.run(`
      INSERT INTO public.church_user_metadata
        (user_id, project_id, department_id, group_uuid, custom_department_name, custom_group_name, position, signature)
      VALUES (?, ?, ?, ?, ?, ?, '회원', ?)
      ON CONFLICT (user_id) DO UPDATE SET
        project_id = EXCLUDED.project_id,
        department_id = EXCLUDED.department_id,
        signature = EXCLUDED.signature
    `, [userId, projectId, assignedDeptId, groupId || null, customDepartmentName || null, customGroupName || null, signature || '사용자 (인)']);

    res.status(201).json({
      message: churchCreateRequest
        ? '새 교회 등록이 완료되었습니다. 이제 즉시 서비스를 이용하실 수 있습니다.'
        : '가입 신청이 접수되었습니다. 관리자 승인을 기다려 주세요.',
      projectId,
      signupStatus
    });
  } catch (error) {
    console.error('[ONBOARDING] Error:', error);
    res.status(500).json({ message: error.message || 'Church onboarding error' });
  }
});

module.exports = router;
