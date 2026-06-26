const express = require('express');
const router = express.Router();
const Tesseract = require('tesseract.js');
const { query } = require('./db');
const { authenticateToken, requireRole } = require('./auth');
const { upload, StorageService } = require('./storage');
const { createNotification } = require('./notifications');

// 결산 마감 검증 헬퍼 함수
async function isPeriodLocked(dateStr) {
  if (!dateStr) return false;
  try {
    const [year, month] = dateStr.split('-');
    const monthVal = `${year}-${month}`; // '2026-06'
    
    const m = parseInt(month, 10);
    const halfVal = `${year}-${m <= 6 ? 1 : 2}`; // '2026-1' or '2026-2'
    
    const yearVal = year; // '2026'

    const locked = await query.get(`
      SELECT lock_id FROM period_locks 
      WHERE (period_type = 'MONTH' AND period_value = ?)
         OR (period_type = 'HALF' AND period_value = ?)
         OR (period_type = 'YEAR' AND period_value = ?)
      LIMIT 1
    `, [monthVal, halfVal, yearVal]);

    return !!locked;
  } catch (err) {
    console.error('Period lock check error:', err);
    return false;
  }
}

// 1. 전표 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  const { groupId, role } = req.user;
  const { group, status, type, startDate, endDate, search } = req.query;

  try {
    let sql = `
      SELECT v.*, g.name as group_name, o.name as organization_name, u.name as writer_name, 
             c.parent_category, c.child_category,
             u1.name as dept_head_name, u2.name as finance_name
      FROM vouchers v
      JOIN groups g ON v.group_id = g.group_id
      JOIN organizations o ON g.organization_id = o.organization_id
      JOIN users u ON v.writer_id = u.user_id
      JOIN account_categories c ON v.category_id = c.category_id
      LEFT JOIN users u1 ON v.dept_head_approver_id = u1.user_id
      LEFT JOIN users u2 ON v.finance_approver_id = u2.user_id
      WHERE 1=1
    `;
    const params = [];

    // 권한 필터: SYSTEM_ADMIN과 AUDITOR만 전체 조회 가능, 나머지는 본인 소속 그룹만 조회 가능
    if (role !== 'SYSTEM_ADMIN' && role !== 'AUDITOR') {
      sql += ' AND v.group_id = ?';
      params.push(groupId);
    } else if (group) {
      sql += ' AND v.group_id = ?';
      params.push(group);
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

    // 다차원 검색 (상호명, 금액, 날짜, 계정과목, 태그, 사용자, 조직, 전표번호 등)
    if (search) {
      sql += ` AND (
        v.vendor LIKE ? OR 
        v.amount LIKE ? OR 
        v.transaction_date LIKE ? OR 
        v.summary LIKE ? OR
        c.child_category LIKE ? OR 
        c.parent_category LIKE ? OR 
        u.name LIKE ? OR 
        o.name LIKE ? OR 
        v.voucher_id = ? OR
        v.voucher_id IN (SELECT DISTINCT voucher_id FROM voucher_attachments WHERE tags LIKE ?)
      )`;
      const searchLike = `%${search}%`;
      params.push(searchLike, searchLike, searchLike, searchLike, searchLike, searchLike, searchLike, searchLike, parseInt(search, 10) || -1, searchLike);
    }

    sql += ' ORDER BY v.transaction_date DESC, v.created_at DESC';

    const vouchers = await query.all(sql, params);
    
    for (let v of vouchers) {
      if (v.has_attachment) {
        // 첫 번째 갤러리 이미지를 대표 썸네일로 노출
        const file = await query.get('SELECT file_key FROM voucher_attachments WHERE voucher_id = ? ORDER BY sort_order ASC LIMIT 1', [v.voucher_id]);
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

// 2. 전표 상세 조회
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId, groupId, role } = req.user;

  try {
    const voucher = await query.get(`
      SELECT v.*, g.name as group_name, o.name as organization_name, u.name as writer_name, 
             c.parent_category, c.child_category, c.type as category_type,
             u1.name as dept_head_name, u2.name as finance_name
      FROM vouchers v
      JOIN groups g ON v.group_id = g.group_id
      JOIN organizations o ON g.organization_id = o.organization_id
      JOIN users u ON v.writer_id = u.user_id
      JOIN account_categories c ON v.category_id = c.category_id
      LEFT JOIN users u1 ON v.dept_head_approver_id = u1.user_id
      LEFT JOIN users u2 ON v.finance_approver_id = u2.user_id
      WHERE v.voucher_id = ?
    `, [id]);

    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    if (role !== 'SYSTEM_ADMIN' && role !== 'AUDITOR' && voucher.writer_id !== userId && voucher.group_id !== groupId) {
      return res.status(403).json({ message: 'Access denied: You do not belong to this group' });
    }

    // 모든 영수증 첨부파일 조회 (정렬 순서 준수)
    const attachments = await query.all('SELECT * FROM voucher_attachments WHERE voucher_id = ? ORDER BY sort_order ASC, attachment_id ASC', [id]);
    voucher.attachments = attachments.map(att => ({
      ...att,
      url: StorageService.getFileUrl(att.file_key),
      ocr_result: att.ocr_result ? JSON.parse(att.ocr_result) : null,
      ocr_raw_result: att.ocr_raw_result || null
    }));

    // 하위 호환성을 위해 첫 번째 첨부파일 필드 유지
    if (attachments.length > 0) {
      voucher.attachment = voucher.attachments[0];
    }

    const histories = await query.all(`
      SELECT h.*, u.name as actor_name, u.role as actor_role, u.position as actor_position
      FROM approval_histories h
      JOIN approvals a ON h.approval_id = a.approval_id
      JOIN users u ON h.actor_id = u.user_id
      WHERE a.target_type = 'VOUCHER' AND a.target_id = ?
      ORDER BY h.created_at ASC
    `, [id]);
    voucher.histories = histories;

    res.json(voucher);
  } catch (error) {
    console.error('Fetch voucher detail error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. 전표 등록 (다중 영수증 백그라운드 OCR 적용)
router.post('/', authenticateToken, upload.array('receipts', 10), async (req, res) => {
  const { groupId, userId } = req.user;
  const {
    transaction_date,
    transaction_type,
    category_id,
    summary,
    vendor,
    amount,
    payment_method,
    status,
    memo,
    dept_head_approver_id,
    finance_approver_id
  } = req.body;

  if (!transaction_date || !transaction_type || !category_id || !summary || !amount) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // 결산 마감 검증
  if (await isPeriodLocked(transaction_date)) {
    return res.status(400).json({ message: '해당 기간은 결산 마감되어 전표를 등록할 수 없습니다.' });
  }

  const voucherStatus = status === 'SUBMITTED' ? 'SUBMITTED' : 'TEMP';
  const hasAttachment = req.files && req.files.length > 0 ? 1 : 0;

  try {
    const result = await query.run(`
      INSERT INTO vouchers (
        group_id, writer_id, dept_head_approver_id, finance_approver_id,
        transaction_date, transaction_type, category_id, summary, vendor,
        amount, payment_method, status, memo, has_attachment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      groupId, userId, 
      dept_head_approver_id ? parseInt(dept_head_approver_id, 10) : null,
      finance_approver_id ? parseInt(finance_approver_id, 10) : null,
      transaction_date, transaction_type, parseInt(category_id, 10),
      summary, vendor, parseFloat(amount), payment_method, voucherStatus, memo, hasAttachment
    ]);

    const voucherId = result.id;

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const fileData = await StorageService.saveFile(file);
        
        await query.run(`
          INSERT INTO voucher_attachments (
            voucher_id, storage_provider, file_name, file_key, file_size, mime_type, ocr_status, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
        `, [
          voucherId, fileData.storageProvider, fileData.fileName, fileData.fileKey,
          fileData.fileSize, fileData.mimeType, i
        ]);
      }

      // 백그라운드 OCR 큐 워커 작동 시작 (비차단)
      const { startQueueWorker } = require('./ocr_queue');
      startQueueWorker();
    }

    if (voucherStatus === 'SUBMITTED') {
      const approvalResult = await query.run(`
        INSERT INTO approvals (target_type, target_id, status, current_step)
        VALUES ('VOUCHER', ?, 'SUBMITTED', 1)
      `, [voucherId]);

      await query.run(`
        INSERT INTO approval_histories (approval_id, actor_id, action, step_number, comment, signature)
        VALUES (?, ?, 'SUBMIT', 1, ?, ?)
      `, [approvalResult.id, userId, '전표 결재 요청', `${req.user.name} (상신)`]);

      if (dept_head_approver_id) {
        await createNotification(
          parseInt(dept_head_approver_id, 10),
          'APPROVAL_REQUEST',
          `새로운 전표 결재 요청이 도착했습니다. (기안자: ${req.user.name}, 금액: ${parseFloat(amount).toLocaleString()}원)`,
          `/vouchers/${voucherId}`
        );
      }
    }

    await query.run(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_position, target_id, result)
      VALUES (?, 'CREATE_VOUCHER', ?, ?, ?, ?, 'SUCCESS')
    `, [userId, `전표 ID: ${voucherId} 등록 (상태: ${voucherStatus}) [적요: ${summary}, 금액: ${parseFloat(amount).toLocaleString()}원, 거래일자: ${transaction_date}, 구분: ${transaction_type === 'EXPENSE' ? '지출' : '수입'}]`, req.ip, req.user.position, voucherId]);

    res.status(201).json({ message: 'Voucher registered successfully', voucherId });
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 3.5 전표 일괄 상신
router.post('/batch-submit', authenticateToken, async (req, res) => {
  const { userId, position } = req.user;
  const { voucherIds, dept_head_approver_id, finance_approver_id } = req.body;

  if (!voucherIds || !Array.isArray(voucherIds) || voucherIds.length === 0) {
    return res.status(400).json({ message: 'Missing voucherIds array' });
  }

  const results = [];
  const errors = [];

  for (const id of voucherIds) {
    try {
      const voucher = await query.get('SELECT * FROM vouchers WHERE voucher_id = ?', [id]);
      if (!voucher) {
        errors.push({ id, message: '전표를 찾을 수 없습니다.' });
        continue;
      }

      if (voucher.writer_id !== userId) {
        errors.push({ id, message: '본인이 작성한 전표만 상신할 수 있습니다.' });
        continue;
      }

      if (voucher.status !== 'TEMP' && voucher.status !== 'REJECTED') {
        errors.push({ id, message: '임시저장 또는 반려 상태의 전표만 상신할 수 있습니다.' });
        continue;
      }

      // 결산 마감 검증
      if (await isPeriodLocked(voucher.transaction_date)) {
        errors.push({ id, message: '해당 기간은 결산 마감되어 상신할 수 없습니다.' });
        continue;
      }

      // update voucher status
      await query.run(`
        UPDATE vouchers
        SET status = 'SUBMITTED', dept_head_approver_id = ?, finance_approver_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE voucher_id = ?
      `, [
        dept_head_approver_id ? parseInt(dept_head_approver_id, 10) : null,
        finance_approver_id ? parseInt(finance_approver_id, 10) : null,
        id
      ]);

      // create approval record
      await query.run('DELETE FROM approvals WHERE target_type = "VOUCHER" AND target_id = ?', [id]);
      const approvalResult = await query.run(`
        INSERT INTO approvals (target_type, target_id, status, current_step)
        VALUES ('VOUCHER', ?, 'SUBMITTED', 1)
      `, [id]);

      // create approval history
      await query.run(`
        INSERT INTO approval_histories (approval_id, actor_id, action, step_number, comment, signature)
        VALUES (?, ?, 'SUBMIT', 1, ?, ?)
      `, [approvalResult.id, userId, '전표 결재 요청 (일괄)', `${req.user.name} (상신)`]);

      // create notification for 1차 승인자
      if (dept_head_approver_id) {
        await createNotification(
          parseInt(dept_head_approver_id, 10),
          'APPROVAL_REQUEST',
          `새로운 전표 결재 요청이 도착했습니다. (기안자: ${req.user.name}, 금액: ${parseFloat(voucher.amount).toLocaleString()}원)`,
          `/vouchers/${id}`
        );
      }

      // audit log
      await query.run(`
        INSERT INTO system_logs (user_id, action, details, ip_address, user_position, target_id, result)
        VALUES (?, 'SUBMIT_VOUCHER_BATCH', ?, ?, ?, ?, 'SUCCESS')
      `, [userId, `전표 ID: ${id} 일괄 상신 완료 [적요: ${voucher.summary}, 금액: ${parseFloat(voucher.amount).toLocaleString()}원, 거래일자: ${voucher.transaction_date}]`, req.ip, position, id]);

      results.push(id);
    } catch (err) {
      console.error(`Batch submit item error for ID ${id}:`, err);
      errors.push({ id, message: err.message });
    }
  }

  res.json({
    message: `일괄 상신 처리가 완료되었습니다. (성공: ${results.length}건, 실패: ${errors.length}건)`,
    successIds: results,
    errors
  });
});


// 4. 전표 수정 (지정 결재선 갱신 및 추가 다중 업로드 포함)
router.put('/:id', authenticateToken, upload.array('receipts', 10), async (req, res) => {
  const { userId, groupId, role } = req.user;
  const { id } = req.params;
  const {
    transaction_date,
    transaction_type,
    category_id,
    summary,
    vendor,
    amount,
    payment_method,
    status,
    memo,
    dept_head_approver_id,
    finance_approver_id
  } = req.body;

  try {
    const voucher = await query.get('SELECT * FROM vouchers WHERE voucher_id = ?', [id]);
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    if (voucher.writer_id !== userId && voucher.group_id !== groupId && role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // 결산 마감 검증
    if (await isPeriodLocked(voucher.transaction_date) || await isPeriodLocked(transaction_date)) {
      return res.status(400).json({ message: '해당 기간은 결산 마감되어 전표를 수정할 수 없습니다.' });
    }

    if (voucher.status !== 'TEMP' && voucher.status !== 'REJECTED') {
      return res.status(400).json({ message: 'Only vouchers in TEMP or REJECTED state can be modified' });
    }

    const nextStatus = status === 'SUBMITTED' ? 'SUBMITTED' : 'TEMP';
    let hasAttachment = voucher.has_attachment;

    if (req.files && req.files.length > 0) {
      hasAttachment = 1;
      // 다음 sort_order 결정
      const maxSortRow = await query.get('SELECT COALESCE(MAX(sort_order), -1) as max_sort FROM voucher_attachments WHERE voucher_id = ?', [id]);
      let nextSortOrder = maxSortRow.max_sort + 1;

      for (const file of req.files) {
        const fileData = await StorageService.saveFile(file);
        await query.run(`
          INSERT INTO voucher_attachments (
            voucher_id, storage_provider, file_name, file_key, file_size, mime_type, ocr_status, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
        `, [id, fileData.storageProvider, fileData.fileName, fileData.fileKey, fileData.fileSize, fileData.mimeType, nextSortOrder++]);
      }

      // 백그라운드 OCR 큐 가동
      const { startQueueWorker } = require('./ocr_queue');
      startQueueWorker();
    }

    await query.run(`
      UPDATE vouchers
      SET transaction_date = ?, transaction_type = ?, category_id = ?, summary = ?,
          vendor = ?, amount = ?, payment_method = ?, status = ?, memo = ?,
          has_attachment = ?, dept_head_approver_id = ?, finance_approver_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE voucher_id = ?
    `, [
      transaction_date || voucher.transaction_date,
      transaction_type || voucher.transaction_type,
      category_id ? parseInt(category_id, 10) : voucher.category_id,
      summary || voucher.summary,
      vendor || voucher.vendor,
      amount ? parseFloat(amount) : voucher.amount,
      payment_method || voucher.payment_method,
      nextStatus,
      memo || voucher.memo,
      hasAttachment,
      dept_head_approver_id ? parseInt(dept_head_approver_id, 10) : voucher.dept_head_approver_id,
      finance_approver_id ? parseInt(finance_approver_id, 10) : voucher.finance_approver_id,
      id
    ]);

    if (nextStatus === 'SUBMITTED') {
      await query.run('DELETE FROM approvals WHERE target_type = "VOUCHER" AND target_id = ?', [id]);
      const approvalResult = await query.run(`
        INSERT INTO approvals (target_type, target_id, status, current_step)
        VALUES ('VOUCHER', ?, 'SUBMITTED', 1)
      `, [id]);

      await query.run(`
        INSERT INTO approval_histories (approval_id, actor_id, action, step_number, comment, signature)
        VALUES (?, ?, 'RESUBMIT', 1, ?, ?)
      `, [approvalResult.id, userId, '전표 재상신 결재 요청', `${req.user.name} (재상신)`]);

      const targetDeptHeadId = dept_head_approver_id || voucher.dept_head_approver_id;
      const targetAmount = amount || voucher.amount;
      if (targetDeptHeadId) {
        await createNotification(
          parseInt(targetDeptHeadId, 10),
          'APPROVAL_REQUEST',
          `전표가 재상신되었습니다. 결재를 요청합니다. (기안자: ${req.user.name}, 금액: ${parseFloat(targetAmount).toLocaleString()}원)`,
          `/vouchers/${id}`
        );
      }
    }

    await query.run(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_position, target_id, result)
      VALUES (?, 'UPDATE_VOUCHER', ?, ?, ?, ?, 'SUCCESS')
    `, [userId, `전표 ID: ${id} 수정 (상태: ${nextStatus}) [적요: ${summary || voucher.summary}, 금액: ${parseFloat(amount || voucher.amount).toLocaleString()}원, 거래일자: ${transaction_date || voucher.transaction_date}]`, req.ip, req.user.position, id]);

    res.json({ message: 'Voucher updated successfully' });
  } catch (error) {
    console.error('Update voucher error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 5. 전표 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  const { userId, groupId, role } = req.user;
  const { id } = req.params;

  try {
    const voucher = await query.get('SELECT * FROM vouchers WHERE voucher_id = ?', [id]);
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    if (voucher.writer_id !== userId && voucher.group_id !== groupId && role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // 결산 마감 검증
    if (await isPeriodLocked(voucher.transaction_date)) {
      return res.status(400).json({ message: '해당 기간은 결산 마감되어 전표를 삭제할 수 없습니다.' });
    }

    if (voucher.status !== 'TEMP' && voucher.status !== 'REJECTED') {
      return res.status(400).json({ message: 'Only vouchers in TEMP or REJECTED state can be deleted' });
    }

    const file = await query.get('SELECT file_key FROM voucher_attachments WHERE voucher_id = ?', [id]);
    if (file) {
      await StorageService.deleteFile(file.file_key);
    }

    await query.run('DELETE FROM vouchers WHERE voucher_id = ?', [id]);

    await query.run(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_position, target_id, result)
      VALUES (?, 'DELETE_VOUCHER', ?, ?, ?, ?, 'SUCCESS')
    `, [userId, `전표 ID: ${id} 삭제 [적요: ${voucher.summary}, 금액: ${parseFloat(voucher.amount).toLocaleString()}원, 거래일자: ${voucher.transaction_date}, 구분: ${voucher.transaction_type === 'EXPENSE' ? '지출' : '수입'}]`, req.ip, req.user.position, id]);

    res.json({ message: 'Voucher deleted successfully' });
  } catch (error) {
    console.error('Delete voucher error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 5.5 전표 상신 취소 (결재 회수)
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  const { userId, position } = req.user;
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ message: '회수 사유를 입력해 주세요.' });
  }

  try {
    const voucher = await query.get('SELECT * FROM vouchers WHERE voucher_id = ?', [id]);
    if (!voucher) {
      return res.status(404).json({ message: '전표를 찾을 수 없습니다.' });
    }

    if (voucher.writer_id !== userId) {
      return res.status(403).json({ message: '본인이 기안한 전표만 회수할 수 있습니다.' });
    }

    if (voucher.status !== 'SUBMITTED' && voucher.status !== 'DEPT_APPROVED') {
      return res.status(400).json({ message: '이미 결재가 끝났거나 회수할 수 없는 상태입니다.' });
    }

    // 결산 마감 검증
    if (await isPeriodLocked(voucher.transaction_date)) {
      return res.status(400).json({ message: '해당 기간은 결산 마감되어 상신을 취소할 수 없습니다.' });
    }

    // 1. 전표 상태를 TEMP(임시저장)로 되돌림
    await query.run('UPDATE vouchers SET status = "TEMP", updated_at = CURRENT_TIMESTAMP WHERE voucher_id = ?', [id]);

    // 2. 관련 approvals 레코드를 CANCELLED로 변경
    await query.run('UPDATE approvals SET status = "CANCELLED", updated_at = CURRENT_TIMESTAMP WHERE target_type = "VOUCHER" AND target_id = ?', [id]);

    // 3. 결재 이력에 CANCEL 기록 추가
    const approval = await query.get('SELECT approval_id FROM approvals WHERE target_type = "VOUCHER" AND target_id = ?', [id]);
    if (approval) {
      await query.run(`
        INSERT INTO approval_histories (approval_id, actor_id, action, step_number, comment, signature)
        VALUES (?, ?, 'CANCEL', 0, ?, ?)
      `, [approval.approval_id, userId, `[회수 사유] ${reason}`, `${req.user.name} (회수)`]);
    }

    // 4. 이 전표와 관련된 기존 결재자들의 결재 대기 알림(APPROVAL_REQUEST)을 CANCELLED로 업데이트 (삭제하지 않음)
    await query.run(`
      UPDATE notifications 
      SET status = 'CANCELLED', is_read = 1 
      WHERE target_url = ? AND type = 'APPROVAL_REQUEST'
    `, [`/vouchers/${id}`]);

    // 5. 감사 추적 로그
    await query.run(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_position, target_id, result)
      VALUES (?, 'CANCEL_VOUCHER_SUBMISSION', ?, ?, ?, ?, 'SUCCESS')
    `, [userId, `전표 ID: ${id} 회수 완료 (사유: ${reason}) [적요: ${voucher.summary}, 금액: ${parseFloat(voucher.amount).toLocaleString()}원, 거래일자: ${voucher.transaction_date}]`, req.ip, position, id]);

    res.json({ message: '전표 상신 취소가 완료되었습니다.' });
  } catch (error) {
    console.error('Cancel voucher submission error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 6. SSE 알림 브로드캐스트 엔드포인트
const { addSseClient, removeSseClient, reprocessAttachment } = require('./ocr_queue');

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

// 7. OCR Queue 관리 목록 조회 (어드민/재정부장 전용)
router.get('/ocr-queue/list', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  try {
    const list = await query.all(`
      SELECT a.*, v.summary as voucher_summary, v.writer_id, u.name as writer_name 
      FROM voucher_attachments a
      JOIN vouchers v ON a.voucher_id = v.voucher_id
      JOIN users u ON v.writer_id = u.user_id
      ORDER BY a.created_at DESC
    `);
    
    // Serve full URLs for queue items
    list.forEach(att => {
      att.url = StorageService.getFileUrl(att.file_key);
      att.ocr_result = att.ocr_result ? JSON.parse(att.ocr_result) : null;
    });

    res.json(list);
  } catch (err) {
    console.error('Fetch ocr queue error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 7.5. 감사팀 전용 영수증 갤러리 조회 API
router.get('/auditor/attachments', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { organizationId, startDate, endDate, minAmount, maxAmount, vendor, categoryId, search } = req.query;
  try {
    let sql = `
      SELECT a.*, v.amount, v.transaction_date, v.vendor as voucher_vendor, v.summary as voucher_summary,
             v.status as voucher_status, v.writer_id, u.name as writer_name,
             g.name as group_name, o.name as organization_name, o.organization_id,
             c.child_category, c.parent_category, c.category_id
      FROM voucher_attachments a
      JOIN vouchers v ON a.voucher_id = v.voucher_id
      JOIN groups g ON v.group_id = g.group_id
      JOIN organizations o ON g.organization_id = o.organization_id
      JOIN users u ON v.writer_id = u.user_id
      JOIN account_categories c ON v.category_id = c.category_id
      WHERE 1=1
    `;
    const params = [];

    if (organizationId) {
      sql += ' AND o.organization_id = ?';
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
      sql += ' AND v.amount >= ?';
      params.push(parseFloat(minAmount));
    }
    if (maxAmount) {
      sql += ' AND v.amount <= ?';
      params.push(parseFloat(maxAmount));
    }
    if (vendor) {
      sql += ' AND (v.vendor LIKE ? OR a.ocr_result LIKE ?)';
      params.push(`%${vendor}%`, `%${vendor}%`);
    }
    if (categoryId) {
      sql += ' AND v.category_id = ?';
      params.push(parseInt(categoryId, 10));
    }
    if (search) {
      sql += ` AND (
        v.vendor LIKE ? OR 
        v.summary LIKE ? OR 
        a.tags LIKE ? OR 
        u.name LIKE ?
      )`;
      const searchLike = `%${search}%`;
      params.push(searchLike, searchLike, searchLike, searchLike);
    }

    sql += ' ORDER BY v.transaction_date DESC, a.sort_order ASC';

    const list = await query.all(sql, params);
    list.forEach(item => {
      item.url = StorageService.getFileUrl(item.file_key);
      item.ocr_result = item.ocr_result ? JSON.parse(item.ocr_result) : null;
    });

    res.json(list);
  } catch (err) {
    console.error('Fetch auditor attachments error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 8. OCR 개별 다시 분석 실행 (어드민/재정부장 전용)
router.post('/ocr-queue/:attachmentId/reprocess', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { attachmentId } = req.params;
  try {
    const att = await query.get('SELECT * FROM voucher_attachments WHERE attachment_id = ?', [attachmentId]);
    if (!att) return res.status(404).json({ message: 'Attachment not found' });

    await reprocessAttachment(parseInt(attachmentId, 10));
    res.json({ message: 'OCR background reprocessing started successfully.' });
  } catch (err) {
    console.error('Reprocess attachment error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 9. 개별 첨부파일 삭제
router.delete('/attachments/:attachmentId', authenticateToken, async (req, res) => {
  const { attachmentId } = req.params;
  const { userId, role } = req.user;
  try {
    const att = await query.get('SELECT * FROM voucher_attachments WHERE attachment_id = ?', [attachmentId]);
    if (!att) return res.status(404).json({ message: 'Attachment not found' });

    const voucher = await query.get('SELECT * FROM vouchers WHERE voucher_id = ?', [att.voucher_id]);
    if (!voucher) return res.status(404).json({ message: 'Voucher not found' });

    if (voucher.writer_id !== userId && role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // 결산 마감 검증
    if (await isPeriodLocked(voucher.transaction_date)) {
      return res.status(400).json({ message: '해당 기간은 결산 마감되어 영수증을 삭제할 수 없습니다.' });
    }

    // 물리 파일 삭제
    await StorageService.deleteFile(att.file_key);

    // DB 레코드 삭제
    await query.run('DELETE FROM voucher_attachments WHERE attachment_id = ?', [attachmentId]);

    // 남은 첨부파일 개수 조사 및 vouchers.has_attachment 업데이트
    const remaining = await query.get('SELECT COUNT(*) as count FROM voucher_attachments WHERE voucher_id = ?', [att.voucher_id]);
    const hasAttachment = remaining.count > 0 ? 1 : 0;
    await query.run('UPDATE vouchers SET has_attachment = ? WHERE voucher_id = ?', [hasAttachment, att.voucher_id]);

    res.json({ message: '영수증이 성공적으로 삭제되었습니다.', hasAttachment });
  } catch (err) {
    console.error('Delete attachment error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 10. 첨부파일 순서 변경
router.post('/attachments/reorder', authenticateToken, async (req, res) => {
  const { orders } = req.body; // array of { attachment_id, sort_order }
  if (!orders || !Array.isArray(orders)) {
    return res.status(400).json({ message: 'Invalid orders format.' });
  }

  try {
    for (const o of orders) {
      await query.run('UPDATE voucher_attachments SET sort_order = ? WHERE attachment_id = ?', [o.sort_order, o.attachment_id]);
    }
    res.json({ message: '영수증 정렬 순서가 변경되었습니다.' });
  } catch (err) {
    console.error('Reorder attachments error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
