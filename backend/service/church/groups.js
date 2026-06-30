// backend/service/church/groups.js
// Church Think - Group (소속 그룹) Management Router
// Platform 3.1: Capability-isolated group APIs under /api/church/admin/groups
const express = require('express');
const router = express.Router();
const { query } = require('../../core/db');

async function getActiveProjectId(req) {
  if (req.user && req.user.projectId) return req.user.projectId;
  if (req.user && req.user.activeProjectId) return req.user.activeProjectId;
  const fallback = await query.get("SELECT project_id FROM public.platform_projects WHERE service_id = 'church_think' LIMIT 1");
  if (fallback) return fallback.project_id;
  return null;
}

// POST /api/church/admin/groups
router.post('/', async (req, res) => {
  const { department_id, name, description } = req.body;
  if (!department_id || !name) return res.status(400).json({ message: '위원회 ID와 그룹명이 필요합니다.' });
  try {
    const projectId = await getActiveProjectId(req);
    const existing = await query.get(
      'SELECT department_id FROM public.church_departments WHERE parent_id = ? AND name = ? AND project_id = ?',
      [parseInt(department_id, 10), name, projectId]
    );
    if (existing) return res.status(400).json({ success: false, message: '이미 등록된 그룹명입니다.' });
    const result = await query.run(
      'INSERT INTO public.church_departments (project_id, parent_id, name, description, is_active) VALUES (?, ?, ?, ?, TRUE) RETURNING department_id',
      [projectId, parseInt(department_id, 10), name, description || '']
    );
    res.status(201).json({ success: true, department: { id: result.id, name }, message: '소속 그룹이 생성되었습니다.' });
  } catch (err) {
    console.error('[GROUPS] Error creating group:', err);
    res.status(500).json({ success: false, message: '그룹 등록 중 오류가 발생했습니다.', details: err.message });
  }
});

// PUT /api/church/admin/groups/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, is_active } = req.body;
  try {
    const projectId = await getActiveProjectId(req);
    await query.run(
      'UPDATE public.church_departments SET name = COALESCE(?, name), description = COALESCE(?, description), is_active = COALESCE(?, is_active) WHERE department_id = ? AND project_id = ?',
      [name, description, is_active, parseInt(id, 10), projectId]
    );
    res.json({ message: '소속 그룹 정보가 수정되었습니다.' });
  } catch (error) {
    console.error('[GROUPS] Error updating group:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// DELETE /api/church/admin/groups/:id — soft delete
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const projectId = await getActiveProjectId(req);
    await query.run(
      'UPDATE public.church_departments SET is_active = FALSE WHERE department_id = ? AND project_id = ?',
      [parseInt(id, 10), projectId]
    );
    res.json({ message: '소속 그룹이 비활성화되었습니다.' });
  } catch (error) {
    console.error('[GROUPS] Error deactivating group:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
