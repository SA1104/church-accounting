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

// 1. 위원회/기관(Organizations) 조회
router.get('/organizations', async (req, res) => {
  try {
    const projectId = await getActiveProjectId(req);
    const orgs = await query.all(
      'SELECT department_id as organization_id, name, description FROM church_departments WHERE parent_id IS NULL AND is_active = TRUE AND project_id = ?',
      [projectId]
    );
    res.json(orgs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});

// Helper to resolve church_profile_id from user context fallback order
async function resolveChurchProfileId(req, bodyChurchId) {
  if (bodyChurchId) return bodyChurchId;
  
  const projectId = req.user?.projectId || req.user?.activeProjectId;
  if (projectId) {
    const cp = await query.get('SELECT church_id FROM public.church_profiles WHERE project_id = ? LIMIT 1', [projectId]);
    if (cp) return cp.church_id;
  }
  
  if (req.user?.accounting?.churchId) {
    return req.user.accounting.churchId;
  }
  
  const defaultCp = await query.get('SELECT church_id FROM public.church_profiles LIMIT 1');
  if (defaultCp) return defaultCp.church_id;
  
  return null;
}

// 2. 위원회/기관 등록
router.post('/organizations', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  console.log('[CREATE DEPARTMENT REQUEST]', {
    user: {
      id: req.user?.id,
      email: req.user?.email,
      role: req.user?.role,
      isAdmin: req.user?.isAdmin,
      projectId: req.user?.projectId,
      activeProjectId: req.user?.activeProjectId,
      accounting: req.user?.accounting
    },
    body: req.body
  });

  const { name, description, churchId } = req.body;
  if (!name) return res.status(400).json({ message: '부서명이 누락되었습니다.' });

  try {
    const projectId = await getActiveProjectId(req);
    const churchProfileId = await resolveChurchProfileId(req, churchId);
    if (!churchProfileId) {
      return res.status(400).json({ message: 'Church Profile ID could not be resolved. Please specify churchId.' });
    }

    const existing = await query.get('SELECT department_id FROM church_departments WHERE parent_id IS NULL AND name = ? AND project_id = ?', [name, projectId]);
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: '이미 등록된 위원회/기관명입니다.' 
      });
    }

    const result = await query.run(
      'INSERT INTO church_departments (project_id, parent_id, name, description, is_active) VALUES (?, NULL, ?, ?, TRUE) RETURNING department_id',
      [projectId, name, description || '']
    );

    res.status(201).json({ success: true, id: result.id, message: 'Organization created successfully' });
  } catch (err) {
    console.error('[CREATE DEPARTMENT ERROR]', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      constraint: err.constraint,
      stack: err.stack,
      body: req.body,
      user: req.user
    });

    return res.status(500).json({
      success: false,
      message: '위원회 등록 중 데이터베이스 오류가 발생했습니다.',
      details: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      constraint: err.constraint
    });
  }
});

// 3. 소속 그룹(Groups) 조회
router.get('/groups', async (req, res) => {
  const { orgId } = req.query;
  try {
    const projectId = await getActiveProjectId(req);
    let sql = `
      SELECT g.department_id as group_id, g.parent_id as organization_id, g.name, g.description, o.name as organization_name 
      FROM church_departments g 
      JOIN church_departments o ON g.parent_id = o.department_id 
      WHERE g.is_active = TRUE AND g.project_id = ?
    `;
    const params = [projectId];
    if (orgId) {
      sql += ' AND g.parent_id = ?';
      params.push(parseInt(orgId, 10));
    }
    const groups = await query.all(sql, params);
    res.json(groups);
  } catch (error) {
    console.error('Database Error details:', error.message, error.stack);
    res.status(500).json({ message: 'Database error', details: error.message });
  }
});

// 4. 소속 그룹 등록
router.post('/groups', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  console.log('[CREATE DEPARTMENT REQUEST]', {
    user: {
      id: req.user?.id,
      email: req.user?.email,
      role: req.user?.role,
      isAdmin: req.user?.isAdmin,
      projectId: req.user?.projectId,
      activeProjectId: req.user?.activeProjectId,
      accounting: req.user?.accounting
    },
    body: req.body
  });

  const { organization_id, name, description, churchId } = req.body;
  if (!organization_id || !name) return res.status(400).json({ message: '부서 ID와 그룹명이 누락되었습니다.' });

  try {
    const projectId = await getActiveProjectId(req);
    const churchProfileId = await resolveChurchProfileId(req, churchId);
    if (!churchProfileId) {
      return res.status(400).json({ message: 'Church Profile ID could not be resolved. Please specify churchId.' });
    }

    const existing = await query.get('SELECT department_id FROM church_departments WHERE parent_id = ? AND name = ? AND project_id = ?', [organization_id, name, projectId]);
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: '이미 등록된 그룹명입니다.' 
      });
    }

    const result = await query.run(
      'INSERT INTO church_departments (project_id, parent_id, name, description, is_active) VALUES (?, ?, ?, ?, TRUE) RETURNING department_id',
      [projectId, organization_id, name, description || '']
    );

    res.status(201).json({ success: true, id: result.id, message: 'Group created successfully' });
  } catch (err) {
    console.error('[CREATE DEPARTMENT ERROR]', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      constraint: err.constraint,
      stack: err.stack,
      body: req.body,
      user: req.user
    });

    return res.status(500).json({
      success: false,
      message: '그룹 등록 중 데이터베이스 오류가 발생했습니다.',
      details: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      constraint: err.constraint
    });
  }
});

// 4b. GET Context Scope configuration for Cascading Dropdowns
const { resolveUserScope } = require('./contextScope');
router.get('/context-scope', authenticateToken, async (req, res) => {
  try {
    const scope = await resolveUserScope(req);
    const projectId = await getActiveProjectId(req);

    // Fetch all active committees
    const committeesList = await query.all(
      'SELECT department_id as id, name FROM public.church_departments WHERE parent_id IS NULL AND is_active = TRUE AND project_id = ?',
      [projectId]
    );

    // Fetch all active groups
    const groupsList = await query.all(
      'SELECT department_id as id, parent_id, name FROM public.church_departments WHERE parent_id IS NOT NULL AND is_active = TRUE AND project_id = ?',
      [projectId]
    );

    const committees = committeesList.map(c => {
      const subGroups = groupsList.filter(g => g.parent_id === c.id).map(g => ({
        id: g.id,
        name: g.name,
        selectable: scope.canViewChurchWide || scope.allowedGroupIds.includes(g.id)
      }));
      return {
        id: c.id,
        name: c.name,
        selectable: scope.canViewAllCommittees || scope.allowedCommitteeIds.includes(c.id),
        groups: subGroups
      };
    });

    res.json({
      fiscalYears: [2025, 2026, 2027],
      defaultFiscalYear: 2026,
      committees,
      permissions: {
        canViewChurchWide: scope.canViewChurchWide,
        canManageOrganizations: scope.canManageOrganizations
      }
    });
  } catch (err) {
    console.error('Error fetching context scope:', err);
    res.status(500).json({ message: 'Internal server error', details: err.message });
  }
});

// 5. 위원회 삭제 (Soft delete)
router.delete('/organizations/:id', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { id } = req.params;
  try {
    const projectId = await getActiveProjectId(req);
    const targetOrg = await query.get('SELECT name FROM church_departments WHERE department_id = ? AND project_id = ?', [id, projectId]);
    if (!targetOrg) return res.status(404).json({ message: '위원회를 찾을 수 없습니다.' });

    await query.run('UPDATE church_departments SET is_active = FALSE WHERE department_id = ? OR parent_id = ?', [id, id]);

    // platform_audit_logs
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, service_id, project_id, action, details, ip_address, result)
      VALUES (?, 'church_think', ?, 'DELETE_ORGANIZATION', ?, ?, 'SUCCESS')
    `, [req.user.userId, projectId, `위원회 삭제: ${targetOrg.name} (ID: ${id})`, req.ip]);

    res.json({ message: `위원회 '${targetOrg.name}' 및 산하 그룹이 성공적으로 삭제되었습니다.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 6. 소속 그룹 삭제 (Soft delete)
router.delete('/groups/:id', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { id } = req.params;
  try {
    const projectId = await getActiveProjectId(req);
    const targetGroup = await query.get('SELECT name FROM church_departments WHERE department_id = ? AND project_id = ?', [id, projectId]);
    if (!targetGroup) return res.status(404).json({ message: '소속 그룹을 찾을 수 없습니다.' });

    await query.run('UPDATE church_departments SET is_active = FALSE WHERE department_id = ?', [id]);

    // platform_audit_logs
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, service_id, project_id, action, details, ip_address, result)
      VALUES (?, 'church_think', ?, 'DELETE_GROUP', ?, ?, 'SUCCESS')
    `, [req.user.userId, projectId, `소속 그룹 삭제: ${targetGroup.name} (ID: ${id})`, req.ip]);

    res.json({ message: `소속 그룹 '${targetGroup.name}'이(가) 성공적으로 삭제되었습니다.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 7. 그룹별 직책 조회 (호환성을 위한 더미/간소화 구현)
router.get('/public/groups/:groupId/positions', async (req, res) => {
  const DEFAULT_POSITIONS = [
    { position_id: 1, name: '회계', role: 'DEPARTMENT_ACCOUNTANT' },
    { position_id: 2, name: '부장', role: 'DEPARTMENT_HEAD' },
    { position_id: 3, name: '위원장', role: 'FINANCE_MANAGER' },
    { position_id: 4, name: '총무', role: 'DEPARTMENT_ACCOUNTANT' },
    { position_id: 5, name: '교역자', role: 'AUDITOR' },
    { position_id: 6, name: '기타', role: 'DEPARTMENT_ACCOUNTANT' }
  ];
  res.json(DEFAULT_POSITIONS);
});

// 8, 9. 직책 등록/삭제 API (Bypassed)
router.post('/groups/:groupId/positions', authenticateToken, async (req, res) => {
  res.status(201).json({ id: 99, message: '직책이 임시 등록되었습니다.' });
});
router.delete('/positions/:positionId', authenticateToken, async (req, res) => {
  res.json({ message: '직책이 삭제되었습니다.' });
});

// 10. 결재자 후보군 리스트 조회
router.get('/users/approvers', authenticateToken, async (req, res) => {
  try {
    const projectId = await getActiveProjectId(req);

    // Resolve Department Heads (Role is 'user' and position is '부장')
    const deptHeads = await query.all(`
      SELECT u.user_id, u.display_name as name, m.position, r.role_id as role 
      FROM platform_profiles u 
      JOIN platform_role_assignments r ON u.user_id = r.user_id AND r.service_id = 'church_think'
      JOIN church_user_metadata m ON u.user_id = m.user_id
      WHERE u.is_active = TRUE AND r.project_id = ? AND m.position = '부장'
    `, [projectId]);
    
    // Resolve Finance Teams / Admins (Role is 'service_admin' or 'super_admin')
    const financeTeams = await query.all(`
      SELECT u.user_id, u.display_name as name, m.position, r.role_id as role 
      FROM platform_profiles u 
      JOIN platform_role_assignments r ON u.user_id = r.user_id AND r.service_id = 'church_think'
      LEFT JOIN church_user_metadata m ON u.user_id = m.user_id
      WHERE u.is_active = TRUE AND r.project_id = ? AND r.role_id IN ('service_admin', 'super_admin')
    `, [projectId]);

    res.json({ deptHeads, financeTeams });
  } catch (error) {
    console.error('Approvers load error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
