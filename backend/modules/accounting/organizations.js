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

// 2. 위원회/기관 등록
router.post('/organizations', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Organization name is required' });
  try {
    const projectId = await getActiveProjectId(req);
    const existing = await query.get('SELECT department_id FROM church_departments WHERE parent_id IS NULL AND name = ? AND project_id = ?', [name, projectId]);
    if (existing) return res.status(400).json({ message: 'Organization already exists' });

    const result = await query.run(
      'INSERT INTO church_departments (project_id, parent_id, name, description) VALUES (?, NULL, ?, ?) RETURNING department_id',
      [projectId, name, description]
    );
    res.status(201).json({ id: result.id, message: 'Organization created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
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
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 4. 소속 그룹 등록
router.post('/groups', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { organization_id, name, description } = req.body;
  if (!organization_id || !name) return res.status(400).json({ message: 'Organization ID and group name are required' });
  try {
    const projectId = await getActiveProjectId(req);
    const existing = await query.get('SELECT department_id FROM church_departments WHERE parent_id = ? AND name = ? AND project_id = ?', [organization_id, name, projectId]);
    if (existing) return res.status(400).json({ message: 'Group name already exists in this organization' });

    const result = await query.run(
      'INSERT INTO church_departments (project_id, parent_id, name, description) VALUES (?, ?, ?, ?) RETURNING department_id',
      [projectId, organization_id, name, description]
    );

    res.status(201).json({ id: result.id, message: 'Group created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
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
