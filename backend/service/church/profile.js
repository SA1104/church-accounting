// backend/service/church/profile.js
// Church Think - Church Profile Router
// Platform 3.1: /api/church/profile
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

// GET /api/church/profile
router.get('/', async (req, res) => {
  try {
    const projectId = await getActiveProjectId(req);
    if (!projectId) {
      return res.json({
        church_name: '신길교회',
        denomination: '기독교대한성결교회',
        primary_color: '#38669b',
        secondary_color: '#2b517d',
        logo_url: '/church_logo.png'
      });
    }
    const profile = await query.get(
      'SELECT church_name, denomination, region, primary_color, secondary_color, logo_url, theme_settings FROM public.church_profiles WHERE project_id = ? LIMIT 1',
      [projectId]
    );
    if (!profile) {
      return res.json({
        church_name: '신길교회',
        denomination: '기독교대한성결교회',
        primary_color: '#38669b',
        secondary_color: '#2b517d',
        logo_url: '/church_logo.png'
      });
    }
    res.json(profile);
  } catch (error) {
    console.error('[CHURCH PROFILE] Error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
