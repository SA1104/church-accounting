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

// 1. 계정과목 전체 조회
router.get('/', authenticateToken, async (req, res) => {
  const { type } = req.query;
  try {
    const projectId = await getActiveProjectId(req);
    let sql = 'SELECT * FROM church_account_categories WHERE is_active = TRUE AND project_id = ?';
    const params = [projectId];
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    sql += ' ORDER BY type DESC, parent_category ASC, child_category ASC';
    const categories = await query.all(sql, params);
    res.json(categories);
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. 계정과목 등록
router.post('/', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { type, parent_category, child_category, description } = req.body;

  if (!type || !parent_category || !child_category) {
    return res.status(400).json({ message: 'Type, parent category, and child category are required' });
  }

  try {
    const projectId = await getActiveProjectId(req);
    const existing = await query.get(`
      SELECT category_id FROM church_account_categories 
      WHERE project_id = ? AND type = ? AND parent_category = ? AND child_category = ?
    `, [projectId, type, parent_category, child_category]);

    if (existing) {
      await query.run(`
        UPDATE church_account_categories SET is_active = TRUE, description = ? 
        WHERE category_id = ?
      `, [description, existing.category_id]);
      return res.json({ message: 'Category added/activated successfully', id: existing.category_id });
    }

    const result = await query.run(`
      INSERT INTO church_account_categories (project_id, type, parent_category, child_category, description)
      VALUES (?, ?, ?, ?, ?)
      RETURNING category_id
    `, [projectId, type, parent_category, child_category, description]);

    res.status(201).json({ message: 'Category created successfully', id: result.id });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. 계정과목 수정
router.put('/:id', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { id } = req.params;
  const { parent_category, child_category, description } = req.body;

  if (!parent_category || !child_category) {
    return res.status(400).json({ message: 'Parent category and child category are required' });
  }

  try {
    const category = await query.get('SELECT * FROM church_account_categories WHERE category_id = ?', [id]);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await query.run(`
      UPDATE church_account_categories 
      SET parent_category = ?, child_category = ?, description = ?
      WHERE category_id = ?
    `, [parent_category, child_category, description, id]);

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 4. 계정과목 삭제
router.delete('/:id', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { id } = req.params;
  try {
    const category = await query.get('SELECT * FROM church_account_categories WHERE category_id = ?', [id]);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const inUse = await query.get('SELECT item_id FROM church_voucher_items WHERE category_id = ? LIMIT 1', [id]);
    if (inUse) {
      await query.run('UPDATE church_account_categories SET is_active = FALSE WHERE category_id = ?', [id]);
      return res.json({ message: 'Category is in use. Soft deleted (deactivated).' });
    }

    await query.run('DELETE FROM church_account_categories WHERE category_id = ?', [id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
