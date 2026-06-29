const express = require('express');
const router = express.Router();
const { query } = require('../../core/db');
const { authenticateToken, requireRole } = require('../../core/auth');
const { upload, StorageService } = require('../../core/storage');
const { addSseClient, removeSseClient, startQueueWorker, reprocessAttachment } = require('../../core/ai');

const requireAccountingRole = (roles) => requireRole(roles, 'accounting');

// Helper to get active project ID
async function getActiveProjectId(req) {
  if (req.user && req.user.projectId) {
    return req.user.projectId;
  }
  const fallback = await query.get("SELECT project_id FROM platform_projects WHERE service_id = 'church_think' LIMIT 1");
  return fallback ? fallback.project_id : null;
}

function getAccountingUser(req) {
  const isSystemAdmin = req.user.roles['platform'] === 'SYSTEM_ADMIN';
  const role = req.user.roles['accounting'];
  const groupId = req.user.accounting ? req.user.accounting.groupId : null;
  const userId = req.user.userId;
  return { userId, role, groupId, isSystemAdmin, hasGlobalAccess: isSystemAdmin || role === 'AUDITOR' };
}

// 1. 결산 마감 검증 헬퍼
async function isPeriodLocked(dateStr, projectId) {
  if (!dateStr) return false;
  try {
    const dateObj = new Date(dateStr);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const monthVal = `${year}-${month < 10 ? '0' + month : month}`;
    
    const halfVal = `${year}-${month <= 6 ? 1 : 2}`;
    const yearVal = `${year}`;

    const locked = await query.get(`
      SELECT period_id FROM church_closing_periods 
      WHERE project_id = ? AND (
         (period_type = 'MONTH' AND period_value = ?)
      OR (period_type = 'HALF' AND period_value = ?)
      OR (period_type = 'YEAR' AND period_value = ?)
      ) LIMIT 1
    `, [projectId, monthVal, halfVal, yearVal]);

    return !!locked;
  } catch (err) {
    console.error('Period lock check error:', err);
    return false;
  }
}

const { enforceContextSecurity } = require('./contextScope');

// 2. 전표 목록 조회
router.get('/', authenticateToken, enforceContextSecurity, async (req, res) => {
  const { userId } = getAccountingUser(req);
  const { group, committee, fiscalYear, status, type, startDate, endDate, search } = req.query;
  const scope = req.contextScope;

  try {
    const projectId = await getActiveProjectId(req);
    let sql = `
      SELECT v.*, d.name as group_name, o.name as organization_name, u.display_name as writer_name, 
             c.parent_category, c.child_category,
             vi.category_id, vi.amount, vi.vendor, vi.payment_method,
             CASE WHEN EXISTS(SELECT 1 FROM church_receipts WHERE voucher_id = v.voucher_id) THEN 1 ELSE 0 END as has_attachment
      FROM church_vouchers v
      JOIN church_departments d ON v.department_id = d.department_id
      LEFT JOIN church_departments o ON d.parent_id = o.department_id
      JOIN platform_profiles u ON v.writer_id = u.user_id
      JOIN church_voucher_items vi ON v.voucher_id = vi.voucher_id
      JOIN church_account_categories c ON vi.category_id = c.category_id
      WHERE v.project_id = ?
    `;
    const params = [projectId];

    // Backend context security enforcement
    if (!scope.canViewChurchWide) {
      if (group) {
        const groupInt = parseInt(group, 10);
        if (!scope.allowedGroupIds.includes(groupInt)) {
          return res.status(403).json({ error: 'FORBIDDEN_CONTEXT', message: '해당 조직 범위의 데이터를 조회할 권한이 없습니다.' });
        }
        sql += ' AND v.department_id = ?';
        params.push(groupInt);
      } else {
        if (scope.allowedGroupIds.length > 0) {
          sql += ` AND v.department_id IN (${scope.allowedGroupIds.map(() => '?').join(',')})`;
          params.push(...scope.allowedGroupIds);
        } else {
          sql += ' AND 1=0';
        }
      }
    } else if (group) {
      sql += ' AND v.department_id = ?';
      params.push(parseInt(group, 10));
    }

    if (committee) {
      const committeeInt = parseInt(committee, 10);
      if (!scope.canViewAllCommittees && !scope.allowedCommitteeIds.includes(committeeInt)) {
        return res.status(403).json({ error: 'FORBIDDEN_CONTEXT', message: '해당 조직 범위의 데이터를 조회할 권한이 없습니다.' });
      }
      sql += ' AND d.parent_id = ?';
      params.push(committeeInt);
    }

    if (fiscalYear) {
      sql += ' AND v.transaction_date >= ? AND v.transaction_date <= ?';
      params.push(`${fiscalYear}-01-01`, `${fiscalYear}-12-31`);
    }

    if (status) {
      sql += ' AND v.status = ?';
      params.push(status);
    }
    if (type) {
      sql += ' AND v.transaction_type = ?';
      params.push(type);
    }
    if (startDate) {
      sql += ' AND v.transaction_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND v.transaction_date <= ?';
      params.push(endDate);
    }

    if (search) {
      sql += ` AND (
        vi.vendor LIKE ? OR 
        CAST(vi.amount AS TEXT) LIKE ? OR 
        CAST(v.transaction_date AS TEXT) LIKE ? OR 
        v.summary LIKE ? OR
        c.child_category LIKE ? OR 
        c.parent_category LIKE ? OR 
        u.display_name LIKE ? OR 
        o.name LIKE ? OR 
        v.voucher_id = ? OR
        v.voucher_id IN (
          SELECT DISTINCT cr.voucher_id 
          FROM church_receipts cr 
          JOIN platform_files a ON cr.file_id = a.file_id 
          WHERE a.tags LIKE ?
        )
      )`;
      const searchLike = `%${search}%`;
      params.push(
        searchLike, searchLike, searchLike, searchLike, searchLike, 
        searchLike, searchLike, searchLike, parseInt(search, 10) || -1, searchLike
      );
    }

    sql += ' ORDER BY v.transaction_date DESC, v.created_at DESC';

    const vouchers = await query.all(sql, params);
    
    // Resolve first receipt URL for list thumbnail preview
    for (let v of vouchers) {
      if (v.has_attachment) {
        const file = await query.get(`
          SELECT a.file_key 
          FROM church_receipts cr
          JOIN platform_files a ON cr.file_id = a.file_id
          WHERE cr.voucher_id = ? 
          ORDER BY cr.sort_order ASC 
          LIMIT 1
        `, [v.voucher_id]);
        if (file) {
          v.attachment_url = StorageService.getFileUrl(file.file_key);
        }
      }
    }

    res.json(vouchers);
  } catch (error) {
    console.error('Fetch vouchers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. 전표 상세 조회
router.get('/:id', authenticateToken, enforceContextSecurity, async (req, res) => {
  const { id } = req.params;
  const { userId } = getAccountingUser(req);
  const scope = req.contextScope;

  try {
    const projectId = await getActiveProjectId(req);
    const voucher = await query.get(`
      SELECT v.*, d.name as group_name, o.name as organization_name, u.display_name as writer_name, 
             c.parent_category, c.child_category, c.type as category_type,
             vi.category_id, vi.amount, vi.vendor, vi.payment_method,
             CASE WHEN EXISTS(SELECT 1 FROM church_receipts WHERE voucher_id = v.voucher_id) THEN 1 ELSE 0 END as has_attachment
      FROM church_vouchers v
      JOIN church_departments d ON v.department_id = d.department_id
      LEFT JOIN church_departments o ON d.parent_id = o.department_id
      JOIN platform_profiles u ON v.writer_id = u.user_id
      JOIN church_voucher_items vi ON v.voucher_id = vi.voucher_id
      JOIN church_account_categories c ON vi.category_id = c.category_id
      WHERE v.voucher_id = ? AND v.project_id = ?
    `, [id, projectId]);

    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    if (!scope.canViewChurchWide && voucher.writer_id !== userId && !scope.allowedGroupIds.includes(voucher.department_id)) {
      return res.status(403).json({ error: 'FORBIDDEN_CONTEXT', message: '해당 조직 범위의 데이터를 조회할 권한이 없습니다.' });
    }

    // Attachments query
    const attachments = await query.all(`
      SELECT a.*, r.sort_order 
      FROM church_receipts r
      JOIN platform_files a ON r.file_id = a.file_id
      WHERE r.voucher_id = ? 
      ORDER BY r.sort_order ASC, a.file_id ASC
    `, [id]);

    attachments.forEach(att => {
      att.url = StorageService.getFileUrl(att.file_key);
      try {
        att.ocr_result = att.ocr_result ? (typeof att.ocr_result === 'string' ? JSON.parse(att.ocr_result) : att.ocr_result) : null;
      } catch(e) {
        att.ocr_result = null;
      }
      // Remap field name compatibility
      att.attachment_id = att.file_id;
    });

    voucher.attachments = attachments;

    // Approval histories query (church_approval_actions)
    const history = await query.all(`
      SELECT h.*, u.display_name as actor_name, m.position as actor_position
      FROM church_approval_actions h
      JOIN platform_profiles u ON h.actor_id = u.user_id
      LEFT JOIN church_user_metadata m ON u.user_id = m.user_id
      WHERE h.voucher_id = ?
      ORDER BY h.created_at ASC
    `, [id]);

    voucher.approvalHistory = history;

    // Fetch designators (dept head & finance managers mapped dynamically from approval lines)
    const designators = await query.all(`
      SELECT approver_id, step_number FROM church_approval_lines WHERE voucher_id = ? ORDER BY step_number ASC
    `, [id]);
    designators.forEach(d => {
      if (d.step_number === 1) voucher.dept_head_approver_id = d.approver_id;
      if (d.step_number === 2) voucher.finance_approver_id = d.approver_id;
    });

    res.json(voucher);
  } catch (error) {
    console.error('Fetch voucher detail error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 4. 전표 신규 생성
router.post('/', authenticateToken, upload.array('receipts'), async (req, res) => {
  const { userId, groupId } = getAccountingUser(req);
  const { transaction_date, transaction_type, category_id, summary, vendor, amount, payment_method, memo, dept_head_approver_id, finance_approver_id } = req.body;

  if (!transaction_date || !transaction_type || !category_id || !summary || !amount) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  const projectId = await getActiveProjectId(req);

  if (await isPeriodLocked(transaction_date, projectId)) {
    return res.status(400).json({ message: '해당 일자의 회계 기수가 이미 마감되었습니다. 등록할 수 없습니다.' });
  }

  try {
    // 1. Insert Voucher Header
    const result = await query.run(`
      INSERT INTO church_vouchers (
        project_id, department_id, writer_id, transaction_date, transaction_type, summary, status, memo
      )
      VALUES (?, ?, ?, ?, ?, ?, 'TEMP', ?)
      RETURNING voucher_id
    `, [projectId, groupId, userId, transaction_date, transaction_type, summary, memo || null]);

    const voucherId = result.id;

    // 2. Insert Voucher Item (1:N structure, seeding default item 1)
    await query.run(`
      INSERT INTO church_voucher_items (voucher_id, category_id, amount, vendor, payment_method)
      VALUES (?, ?, ?, ?, ?)
    `, [voucherId, parseInt(category_id, 10), parseFloat(amount), vendor || null, payment_method || 'CARD']);

    // 3. Create Approval Lines
    if (dept_head_approver_id) {
      await query.run(`
        INSERT INTO church_approval_lines (voucher_id, approver_id, step_number, status)
        VALUES (?, ?, 1, 'PENDING')
      `, [voucherId, dept_head_approver_id]);
    }
    if (finance_approver_id) {
      await query.run(`
        INSERT INTO church_approval_lines (voucher_id, approver_id, step_number, status)
        VALUES (?, ?, 2, 'PENDING')
      `, [voucherId, finance_approver_id]);
    }

    // 4. Attachments processing
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const fileMeta = await StorageService.saveFile(file);

        // Insert into platform_files
        const attachRes = await query.run(`
          INSERT INTO platform_files (project_id, bucket_name, file_key, original_name, mime_type, file_size, uploaded_by, ocr_status)
          VALUES (?, 'receipts', ?, ?, ?, ?, ?, 'PENDING')
          RETURNING file_id
        `, [projectId, fileMeta.fileKey, fileMeta.fileName, fileMeta.mimeType, fileMeta.fileSize, userId]);

        // Map to church_receipts
        await query.run(`
          INSERT INTO church_receipts (voucher_id, file_id, sort_order)
          VALUES (?, ?, ?)
        `, [voucherId, attachRes.id, i]);
      }
      
      startQueueWorker();
    }

    res.status(201).json({ voucher_id: voucherId, message: 'Voucher created successfully as temporary draft.' });
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 5. 전표 수정
router.put('/:id', authenticateToken, upload.array('receipts'), async (req, res) => {
  const { id } = req.params;
  const { userId, groupId } = getAccountingUser(req);
  const { transaction_date, transaction_type, category_id, summary, vendor, amount, payment_method, memo, dept_head_approver_id, finance_approver_id } = req.body;

  try {
    const projectId = await getActiveProjectId(req);
    const voucher = await query.get('SELECT * FROM church_vouchers WHERE voucher_id = ? AND project_id = ?', [id, projectId]);
    if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
    if (voucher.writer_id !== userId && voucher.department_id !== groupId) {
      return res.status(403).json({ message: 'No edit permissions' });
    }

    if (await isPeriodLocked(transaction_date || voucher.transaction_date, projectId)) {
      return res.status(400).json({ message: '해당 일자의 회계 기수가 이미 마감되었습니다. 수정할 수 없습니다.' });
    }

    // 1. Update Voucher Header
    await query.run(`
      UPDATE church_vouchers
      SET transaction_date = ?, transaction_type = ?, summary = ?, 
          memo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE voucher_id = ?
    `, [
      transaction_date || voucher.transaction_date,
      transaction_type || voucher.transaction_type,
      summary || voucher.summary,
      memo !== undefined ? memo : voucher.memo,
      id
    ]);

    // 2. Update Voucher Item 1
    const firstItem = await query.get('SELECT item_id FROM church_voucher_items WHERE voucher_id = ? LIMIT 1', [id]);
    if (firstItem) {
      await query.run(`
        UPDATE church_voucher_items
        SET category_id = ?, amount = ?, vendor = ?, payment_method = ?
        WHERE item_id = ?
      `, [
        category_id ? parseInt(category_id, 10) : firstItem.category_id,
        amount ? parseFloat(amount) : firstItem.amount,
        vendor !== undefined ? vendor : firstItem.vendor,
        payment_method || firstItem.payment_method,
        firstItem.item_id
      ]);
    }

    // 3. Update Approval Lines (clear and recreate)
    await query.run('DELETE FROM church_approval_lines WHERE voucher_id = ?', [id]);
    if (dept_head_approver_id) {
      await query.run(`
        INSERT INTO church_approval_lines (voucher_id, approver_id, step_number, status)
        VALUES (?, ?, 1, 'PENDING')
      `, [id, dept_head_approver_id]);
    }
    if (finance_approver_id) {
      await query.run(`
        INSERT INTO church_approval_lines (voucher_id, approver_id, step_number, status)
        VALUES (?, ?, 2, 'PENDING')
      `, [id, finance_approver_id]);
    }

    // 4. Handle new attachments
    if (req.files && req.files.length > 0) {
      const maxSortRow = await query.get('SELECT COALESCE(MAX(sort_order), -1) as max_sort FROM church_receipts WHERE voucher_id = ?', [id]);
      let nextSort = maxSortRow.max_sort + 1;

      for (const file of req.files) {
        const fileMeta = await StorageService.saveFile(file);
        const attachRes = await query.run(`
          INSERT INTO platform_files (project_id, bucket_name, file_key, original_name, mime_type, file_size, uploaded_by, ocr_status)
          VALUES (?, 'receipts', ?, ?, ?, ?, ?, 'PENDING')
          RETURNING file_id
        `, [projectId, fileMeta.fileKey, fileMeta.fileName, fileMeta.mimeType, fileMeta.fileSize, userId]);

        await query.run(`
          INSERT INTO church_receipts (voucher_id, file_id, sort_order)
          VALUES (?, ?, ?)
        `, [id, attachRes.id, nextSort++]);
      }
      
      startQueueWorker();
    }

    res.json({ message: 'Voucher updated successfully' });
  } catch (error) {
    console.error('Update voucher error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 6. 전표 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId, groupId } = getAccountingUser(req);

  try {
    const projectId = await getActiveProjectId(req);
    const voucher = await query.get('SELECT * FROM church_vouchers WHERE voucher_id = ? AND project_id = ?', [id, projectId]);
    if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
    if (voucher.writer_id !== userId && voucher.department_id !== groupId) {
      return res.status(403).json({ message: 'No delete permissions' });
    }

    if (await isPeriodLocked(voucher.transaction_date, projectId)) {
      return res.status(400).json({ message: '해당 일자의 회계 기수가 이미 마감되었습니다. 삭제할 수 없습니다.' });
    }

    // Delete attachments from storage and metadata
    const attachments = await query.all(`
      SELECT a.file_key, a.file_id 
      FROM church_receipts cr
      JOIN platform_files a ON cr.file_id = a.file_id
      WHERE cr.voucher_id = ?
    `, [id]);

    for (const att of attachments) {
      await StorageService.deleteFile(att.file_key);
      await query.run('DELETE FROM platform_files WHERE file_id = ?', [att.file_id]);
    }

    await query.run('DELETE FROM church_vouchers WHERE voucher_id = ?', [id]);
    res.json({ message: 'Voucher deleted successfully.' });
  } catch (error) {
    console.error('Delete voucher error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 7. 개별 첨부파일 삭제
router.delete('/attachments/:attachmentId', authenticateToken, async (req, res) => {
  const { attachmentId } = req.params; // file_id UUID
  const { userId } = getAccountingUser(req);
  try {
    const projectId = await getActiveProjectId(req);
    const att = await query.get('SELECT * FROM platform_files WHERE file_id = ? AND project_id = ?', [attachmentId, projectId]);
    if (!att) return res.status(404).json({ message: 'Attachment not found' });

    const mapping = await query.get('SELECT voucher_id FROM church_receipts WHERE file_id = ?', [attachmentId]);
    if (mapping) {
      const voucher = await query.get('SELECT writer_id, transaction_date FROM church_vouchers WHERE voucher_id = ?', [mapping.voucher_id]);
      if (voucher && voucher.writer_id !== userId) {
        return res.status(403).json({ message: 'No permission to delete attachment' });
      }
      if (voucher && await isPeriodLocked(voucher.transaction_date, projectId)) {
        return res.status(400).json({ message: '해당 전표의 기수가 이미 마감되어 첨부파일을 삭제할 수 없습니다.' });
      }
    }

    await StorageService.deleteFile(att.file_key);
    await query.run('DELETE FROM platform_files WHERE file_id = ?', [attachmentId]);
    // Cascades into church_receipts automatically via foreign key ON DELETE CASCADE

    res.json({ message: 'Attachment deleted successfully' });
  } catch (err) {
    console.error('Delete attachment error:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// 8. 첨부파일 정렬 순서 업데이트
router.post('/attachments/reorder', authenticateToken, async (req, res) => {
  const { orders } = req.body;
  if (!orders || !Array.isArray(orders)) {
    return res.status(400).json({ message: 'Missing order array' });
  }
  try {
    for (const o of orders) {
      await query.run('UPDATE church_receipts SET sort_order = ? WHERE file_id = ?', [o.sort_order, o.attachment_id]);
    }
    res.json({ message: 'Attachment order updated successfully.' });
  } catch (err) {
    console.error('Reorder error:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// 9. OCR 실시간 SSE 연결 포트
router.get('/sse', authenticateToken, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  addSseClient(res);

  req.on('close', () => {
    removeSseClient(res);
  });
});

// 10. OCR 대기열 조회 (SYSTEM_ADMIN, AUDITOR 전용)
router.get('/ocr-queue/list', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  try {
    const projectId = await getActiveProjectId(req);
    const list = await query.all(`
      SELECT a.*, v.summary as voucher_summary, v.writer_id, u.display_name as writer_name 
      FROM church_receipts cr
      JOIN platform_files a ON cr.file_id = a.file_id
      JOIN church_vouchers v ON cr.voucher_id = v.voucher_id
      JOIN platform_profiles u ON v.writer_id = u.user_id
      WHERE a.project_id = ?
      ORDER BY a.created_at DESC
    `, [projectId]);
    
    list.forEach(att => {
      att.url = StorageService.getFileUrl(att.file_key);
      try {
        att.ocr_result = att.ocr_result ? (typeof att.ocr_result === 'string' ? JSON.parse(att.ocr_result) : att.ocr_result) : null;
      } catch(e) {
        att.ocr_result = null;
      }
      att.attachment_id = att.file_id;
    });

    res.json(list);
  } catch (err) {
    console.error('Fetch ocr queue error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 11. 감사팀 전용 영수증 갤러리 조회
router.get('/auditor/attachments', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { organizationId, startDate, endDate, minAmount, maxAmount, vendor, categoryId, search } = req.query;
  try {
    const projectId = await getActiveProjectId(req);
    let sql = `
      SELECT a.*, vi.amount, v.transaction_date, vi.vendor as voucher_vendor, v.summary as voucher_summary,
             v.status as voucher_status, v.writer_id, u.display_name as writer_name,
             g.name as group_name, o.name as organization_name, o.department_id as organization_id,
             c.child_category, c.parent_category, c.category_id
      FROM church_receipts cr
      JOIN platform_files a ON cr.file_id = a.file_id
      JOIN church_vouchers v ON cr.voucher_id = v.voucher_id
      JOIN church_departments g ON v.department_id = g.department_id
      LEFT JOIN church_departments o ON g.parent_id = o.department_id
      JOIN platform_profiles u ON v.writer_id = u.user_id
      JOIN church_voucher_items vi ON v.voucher_id = vi.voucher_id
      JOIN church_account_categories c ON vi.category_id = c.category_id
      WHERE a.project_id = ?
    `;
    const params = [projectId];

    if (organizationId) {
      sql += ' AND o.department_id = ?';
      params.push(parseInt(organizationId, 10));
    }
    if (startDate) {
      sql += ' AND v.transaction_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND v.transaction_date <= ?';
      params.push(endDate);
    }
    if (minAmount) {
      sql += ' AND vi.amount >= ?';
      params.push(parseFloat(minAmount));
    }
    if (maxAmount) {
      sql += ' AND vi.amount <= ?';
      params.push(parseFloat(maxAmount));
    }
    if (vendor) {
      sql += ' AND (vi.vendor LIKE ? OR CAST(a.ocr_result AS TEXT) LIKE ?)';
      params.push(`%${vendor}%`, `%${vendor}%`);
    }
    if (categoryId) {
      sql += ' AND vi.category_id = ?';
      params.push(parseInt(categoryId, 10));
    }
    if (search) {
      sql += ` AND (
        vi.vendor LIKE ? OR 
        v.summary LIKE ? OR 
        a.tags LIKE ? OR 
        u.display_name LIKE ?
      )`;
      const searchLike = `%${search}%`;
      params.push(searchLike, searchLike, searchLike, searchLike);
    }

    sql += ' ORDER BY v.transaction_date DESC, cr.sort_order ASC';

    const list = await query.all(sql, params);
    list.forEach(item => {
      item.url = StorageService.getFileUrl(item.file_key);
      try {
        item.ocr_result = item.ocr_result ? (typeof item.ocr_result === 'string' ? JSON.parse(item.ocr_result) : item.ocr_result) : null;
      } catch(e) {
        item.ocr_result = null;
      }
      item.attachment_id = item.file_id;
    });

    res.json(list);
  } catch (err) {
    console.error('Fetch auditor attachments error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 12. OCR 개별 재분석 실행
router.post('/ocr-queue/:attachmentId/reprocess', authenticateToken, requireAccountingRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { attachmentId } = req.params; // file_id UUID
  try {
    const projectId = await getActiveProjectId(req);
    const att = await query.get('SELECT * FROM platform_files WHERE file_id = ? AND project_id = ?', [attachmentId, projectId]);
    if (!att) return res.status(404).json({ message: 'Attachment not found' });

    // Since reprocessAttachment uses Tesseract locally, we pass it.
    // For now, it will function locally. In Supabase Production, this shifts to Edge Functions.
    await reprocessAttachment(attachmentId);
    res.json({ message: 'OCR background reprocessing started successfully.' });
  } catch (err) {
    console.error('Reprocess attachment error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
