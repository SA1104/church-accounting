// backend/service/church/committees.js
// Church Think - Committee (위원회) Management Router
// Platform 3.1: Capability-isolated church committee APIs under /api/church/admin/committees
const express = require('express');
const router = express.Router();
const { query } = require('../../core/db');

async function getActiveProjectId(req) {
  if (req.user && req.user.projectId) return req.user.projectId;
  if (req.user && req.user.activeProjectId) return req.user.activeProjectId;
  const fallback = await query.get("SELECT project_id FROM public.platform_projects WHERE service_id = 'church_think' LIMIT 1");
  if (fallback) return fallback.project_id;
  const anyProject = await query.get('SELECT project_id FROM public.platform_projects LIMIT 1');
  return anyProject ? anyProject.project_id : null;
}

// GET /api/church/admin/committees
router.get('/', async (req, res) => {
  try {
    const projectId = await getActiveProjectId(req);
    const list = await query.all(
      'SELECT department_id, name, description, is_active FROM public.church_departments WHERE parent_id IS NULL AND project_id = ? ORDER BY name ASC',
      [projectId]
    );
    res.json(list);
  } catch (error) {
    console.error('[COMMITTEES] Error fetching committees:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// POST /api/church/admin/committees
router.post('/', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: '위원회명이 누락되었습니다.' });
  try {
    const projectId = await getActiveProjectId(req);
    const existing = await query.get(
      'SELECT department_id FROM public.church_departments WHERE parent_id IS NULL AND name = ? AND project_id = ?',
      [name, projectId]
    );
    if (existing) {
      return res.status(400).json({ success: false, message: '이미 등록된 위원회/기관명입니다.' });
    }
    const result = await query.run(
      'INSERT INTO public.church_departments (project_id, parent_id, name, description, is_active) VALUES (?, NULL, ?, ?, TRUE) RETURNING department_id',
      [projectId, name, description || '']
    );
    res.status(201).json({ success: true, department: { id: result.id, name }, message: '위원회가 생성되었습니다.' });
  } catch (err) {
    console.error('[COMMITTEES] Error creating committee:', err);
    res.status(500).json({ success: false, message: '위원회 등록 중 데이터베이스 오류가 발생했습니다.', details: err.message });
  }
});

// PUT /api/church/admin/committees/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, is_active } = req.body;
  try {
    const projectId = await getActiveProjectId(req);
    await query.run(
      'UPDATE public.church_departments SET name = COALESCE(?, name), description = COALESCE(?, description), is_active = COALESCE(?, is_active) WHERE department_id = ? AND project_id = ?',
      [name, description, is_active, parseInt(id, 10), projectId]
    );
    res.json({ message: '위원회 정보가 수정되었습니다.' });
  } catch (error) {
    console.error('[COMMITTEES] Error updating committee:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// DELETE /api/church/admin/committees/:id — soft delete
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const projectId = await getActiveProjectId(req);
    await query.run(
      'UPDATE public.church_departments SET is_active = FALSE WHERE department_id = ? AND project_id = ?',
      [parseInt(id, 10), projectId]
    );
    res.json({ message: '위원회가 비활성화되었습니다.' });
  } catch (error) {
    console.error('[COMMITTEES] Error deactivating committee:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/church/admin/committees/:id/groups
router.get('/:id/groups', async (req, res) => {
  const { id } = req.params;
  try {
    const projectId = await getActiveProjectId(req);
    const list = await query.all(
      'SELECT department_id as group_id, parent_id as department_id, name, description, is_active FROM public.church_departments WHERE parent_id = ? AND project_id = ? ORDER BY name ASC',
      [parseInt(id, 10), projectId]
    );
    res.json(list);
  } catch (error) {
    console.error('[COMMITTEES] Error fetching groups:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
