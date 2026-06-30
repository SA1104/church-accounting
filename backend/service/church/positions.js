// backend/service/church/positions.js
// Church Think - Position (직책) Master Router
// Platform 3.1: Capability-isolated position APIs under /api/church/positions
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

// GET /api/church/positions
router.get('/', async (req, res) => {
  try {
    const projectId = await getActiveProjectId(req);
    const includeInactive = req.query.include_inactive === 'true';
    let positions;
    if (includeInactive) {
      positions = await query.all('SELECT * FROM public.church_positions WHERE project_id = ? ORDER BY name ASC', [projectId]);
    } else {
      positions = await query.all('SELECT * FROM public.church_positions WHERE project_id = ? AND is_active = TRUE ORDER BY name ASC', [projectId]);
    }
    res.json(positions);
  } catch (error) {
    console.error('[POSITIONS] Error fetching positions:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/church/positions/public — no auth required
router.get('/public', async (req, res) => {
  try {
    const positions = await query.all('SELECT position_id, name, role_code FROM public.church_positions WHERE is_active = TRUE ORDER BY name ASC');
    res.json(positions);
  } catch (error) {
    console.error('[POSITIONS] Error fetching public positions:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// POST /api/church/positions
router.post('/', async (req, res) => {
  const { name, role_code, description } = req.body;
  if (!name || !role_code) return res.status(400).json({ message: '직책명과 역할 코드가 필요합니다.' });
  try {
    const projectId = await getActiveProjectId(req);
    const result = await query.run(
      'INSERT INTO public.church_positions (project_id, name, role_code, description, is_active) VALUES (?, ?, ?, ?, TRUE) RETURNING position_id',
      [projectId, name, role_code, description || '']
    );
    res.status(201).json({ success: true, position: { id: result.id, name, role_code }, message: '직책이 등록되었습니다.' });
  } catch (err) {
    console.error('[POSITIONS] Error creating position:', err);
    res.status(500).json({ success: false, message: '직책 등록 중 오류가 발생했습니다.', details: err.message });
  }
});

// DELETE /api/church/positions/:id — soft delete (is_active = FALSE)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query.run(
      'UPDATE public.church_positions SET is_active = FALSE WHERE position_id = ?',
      [id]
    );
    res.json({ message: '직책이 비활성화되었습니다. 기존 배정은 유지됩니다.' });
  } catch (error) {
    console.error('[POSITIONS] Error deactivating position:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
