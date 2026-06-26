const express = require('express');
const router = express.Router();
const { query } = require('./db');
const { authenticateToken, requireRole } = require('./auth');

// 1. 계정과목 전체 조회 (누구나 조회 가능)
router.get('/', authenticateToken, async (req, res) => {
  const { type } = req.query; // 'INCOME' or 'EXPENSE'
  try {
    let sql = 'SELECT * FROM account_categories WHERE is_active = 1';
    const params = [];
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

// 2. 계정과목 등록 (SYSTEM_ADMIN, FINANCE_MANAGER 전용)
router.post('/', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { type, parent_category, child_category, description } = req.body;

  if (!type || !parent_category || !child_category) {
    return res.status(400).json({ message: 'Type, parent category, and child category are required' });
  }

  try {
    // 중복 확인
    const existing = await query.get(`
      SELECT category_id FROM account_categories 
      WHERE type = ? AND parent_category = ? AND child_category = ?
    `, [type, parent_category, child_category]);

    if (existing) {
      // 비활성화된 계정일 수 있으므로 다시 활성화 처리
      await query.run(`
        UPDATE account_categories SET is_active = 1, description = ? 
        WHERE category_id = ?
      `, [description, existing.category_id]);
      return res.json({ message: 'Category added/activated successfully', id: existing.category_id });
    }

    const result = await query.run(`
      INSERT INTO account_categories (type, parent_category, child_category, description)
      VALUES (?, ?, ?, ?)
    `, [type, parent_category, child_category, description]);

    res.status(201).json({ message: 'Category created successfully', id: result.id });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. 계정과목 수정 (SYSTEM_ADMIN, FINANCE_MANAGER 전용)
router.put('/:id', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { id } = req.params;
  const { parent_category, child_category, description } = req.body;

  if (!parent_category || !child_category) {
    return res.status(400).json({ message: 'Parent category and child category are required' });
  }

  try {
    const category = await query.get('SELECT * FROM account_categories WHERE category_id = ?', [id]);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await query.run(`
      UPDATE account_categories 
      SET parent_category = ?, child_category = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE category_id = ?
    `, [parent_category, child_category, description, id]);

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 4. 계정과목 삭제 (SYSTEM_ADMIN, FINANCE_MANAGER 전용 - soft delete)
router.delete('/:id', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { id } = req.params;
  try {
    const category = await query.get('SELECT * FROM account_categories WHERE category_id = ?', [id]);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // 전표에서 이미 이 카테고리를 쓰고 있는지 검사
    const inUse = await query.get('SELECT voucher_id FROM vouchers WHERE category_id = ? LIMIT 1', [id]);
    if (inUse) {
      // 전표에서 사용 중이면 논리 삭제(비활성화)만 진행
      await query.run('UPDATE account_categories SET is_active = 0 WHERE category_id = ?', [id]);
      return res.json({ message: 'Category is in use. Soft deleted (deactivated).' });
    }

    // 전표에 없다면 물리 삭제 가능
    await query.run('DELETE FROM account_categories WHERE category_id = ?', [id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
