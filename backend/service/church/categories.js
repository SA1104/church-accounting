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
  const { type, include_inactive } = req.query;
  try {
    const projectId = await getActiveProjectId(req);
    let sql = 'SELECT * FROM church_account_categories WHERE project_id = ?';
    if (include_inactive !== 'true') {
      sql += ' AND is_active = TRUE';
    }
    const params = [projectId];
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    sql += ' ORDER BY type DESC, sort_order ASC, parent_category ASC, child_category ASC';
    const categories = await query.all(sql, params);
    
    // Ensure the response is always a flat array of rows
    let responseData = [];
    if (Array.isArray(categories)) {
      responseData = categories;
    } else if (categories && Array.isArray(categories.data)) {
      responseData = categories.data;
    } else if (categories && Array.isArray(categories.categories)) {
      responseData = categories.categories;
    } else if (typeof categories === 'string') {
      try {
        const parsed = JSON.parse(categories);
        responseData = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        responseData = [];
      }
    }

    res.json(responseData);
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. 계정과목 등록
router.post('/', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'FINANCE_CHAIR', 'FINANCE_MANAGER', 'DEPARTMENT_ACCOUNTANT', 'PASTOR']), async (req, res) => {
  console.log('1. request url:', req.originalUrl);
  console.log('2. request body:', req.body);
  console.log('3. authenticated user:', req.user?.username);
  console.log('4. authenticated role:', req.user?.accounting?.role);
  console.log('5. middleware result: Passed requireAccountingRole');

  const { type, parent_category, child_category, description } = req.body;

  if (!type || !parent_category || !child_category) {
    console.log('8. response status:', 400);
    console.log('9. response body:', { message: 'Type, parent category, and child category are required' });
    return res.status(400).json({ message: 'Type, parent category, and child category are required' });
  }

  try {
    const projectId = await getActiveProjectId(req);
    const sql1 = `
      SELECT category_id FROM church_account_categories 
      WHERE project_id = ? AND type = ? AND parent_category = ? AND child_category = ?
    `;
    console.log('6. SQL executed:', sql1, [projectId, type, parent_category, child_category]);
    const existing = await query.get(sql1, [projectId, type, parent_category, child_category]);

    if (existing) {
      const sql2 = `
        UPDATE church_account_categories SET is_active = TRUE, description = ? 
        WHERE category_id = ?
      `;
      console.log('6. SQL executed:', sql2, [description, existing.category_id]);
      await query.run(sql2, [description, existing.category_id]);
      console.log('8. response status:', 200);
      console.log('9. response body:', { message: 'Category added/activated successfully', id: existing.category_id });
      return res.json({ message: 'Category added/activated successfully', id: existing.category_id });
    }

    const sql3 = `
      INSERT INTO church_account_categories (project_id, type, parent_category, child_category, description)
      VALUES (?, ?, ?, ?, ?)
      RETURNING category_id
    `;
    console.log('6. SQL executed:', sql3, [projectId, type, parent_category, child_category, description]);
    const result = await query.run(sql3, [projectId, type, parent_category, child_category, description]);

    console.log('8. response status:', 201);
    console.log('9. response body:', { message: 'Category created successfully', id: result.id });
    res.status(201).json({ message: 'Category created successfully', id: result.id });
  } catch (error) {
    console.log('7. SQL error:', error);
    console.log('8. response status:', 500);
    console.log('9. response body:', { message: error.message });
    res.status(500).json({ message: error.message });
  }
});

// 3. 계정과목 수정
router.put('/:id', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'FINANCE_CHAIR', 'FINANCE_MANAGER', 'DEPARTMENT_ACCOUNTANT', 'PASTOR']), async (req, res) => {
  const { id } = req.params;
  const { category_type, major_category, minor_category, description, is_active, sort_order } = req.body;
  const user = req.user;

  try {
    const projectId = await getActiveProjectId(req);
    const category = await query.get('SELECT * FROM church_account_categories WHERE category_id = ? AND project_id = ?', [id, projectId]);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const newType = category_type || category.type;
    const newParent = major_category || category.parent_category;
    const newChild = minor_category || category.child_category;
    const newDesc = description !== undefined ? description : category.description;
    const newActive = is_active !== undefined ? is_active : category.is_active;
    const newSortOrder = sort_order !== undefined ? sort_order : (category.sort_order || 0);

    await query.run(`
      UPDATE church_account_categories 
      SET type = ?, parent_category = ?, child_category = ?, description = ?, is_active = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
      WHERE category_id = ?
    `, [newType, newParent, newChild, newDesc, newActive, newSortOrder, user.id, id]);

    // 감사 로그 기록
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, project_id, service_id, action, details)
      VALUES (?, ?, 'church_think', 'UPDATE_ACCOUNT_CATEGORY', ?)
    `, [user.id, projectId, `Category ID ${id} updated: [${category.parent_category}] ${category.child_category} -> [${newParent}] ${newChild}`]);

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 4. 계정과목 삭제 (Soft Delete & Block if used)
router.delete('/:id', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'FINANCE_CHAIR', 'FINANCE_MANAGER', 'DEPARTMENT_ACCOUNTANT', 'PASTOR']), async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const projectId = await getActiveProjectId(req);
    const category = await query.get('SELECT * FROM church_account_categories WHERE category_id = ? AND project_id = ?', [id, projectId]);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const inUse = await query.get('SELECT item_id FROM church_voucher_items WHERE category_id = ? LIMIT 1', [id]);
    if (inUse) {
      return res.status(400).json({ message: '이미 사용된 계정과목입니다. 비활성화를 이용하세요.' });
    }

    // Soft delete since it's unused
    await query.run(`
      UPDATE church_account_categories 
      SET is_active = FALSE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ?
      WHERE category_id = ?
    `, [user.id, id]);

    // 감사 로그 기록
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, project_id, service_id, action, details)
      VALUES (?, ?, 'church_think', 'DELETE_ACCOUNT_CATEGORY', ?)
    `, [user.id, projectId, `Category ID ${id} deleted (soft delete)`]);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 5. 비활성화/활성화 토글
router.patch('/:id/active', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'FINANCE_CHAIR', 'FINANCE_MANAGER', 'DEPARTMENT_ACCOUNTANT', 'PASTOR']), async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  const user = req.user;

  try {
    const projectId = await getActiveProjectId(req);
    const category = await query.get('SELECT * FROM church_account_categories WHERE category_id = ? AND project_id = ?', [id, projectId]);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await query.run(`
      UPDATE church_account_categories 
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
      WHERE category_id = ?
    `, [is_active, user.id, id]);

    // 감사 로그 기록
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, project_id, service_id, action, details)
      VALUES (?, ?, 'church_think', 'TOGGLE_ACCOUNT_CATEGORY_ACTIVE', ?)
    `, [user.id, projectId, `Category ID ${id} is_active changed to ${is_active}`]);

    res.json({ message: `Category ${is_active ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Toggle category active error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
