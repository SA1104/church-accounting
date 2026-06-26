const express = require('express');
const router = express.Router();
const { query } = require('./db');
const { authenticateToken } = require('./auth');
const { createNotification } = require('./notifications');

// 1. 결재 대기 문서 목록 조회 (지정 결재자 기반 필터링)
router.get('/pending', authenticateToken, async (req, res) => {
  const { userId, role } = req.user;

  try {
    let vouchers = [];
    let ledgers = [];
    let reports = [];

    // 자신이 지정된 1차 결재자 혹은 최종 결재자인 전표 조회
    vouchers = await query.all(`
      SELECT v.*, g.name as group_name, o.name as organization_name, u.name as writer_name, 
             c.parent_category, c.child_category
      FROM vouchers v
      JOIN groups g ON v.group_id = g.group_id
      JOIN organizations o ON g.organization_id = o.organization_id
      JOIN users u ON v.writer_id = u.user_id
      JOIN account_categories c ON v.category_id = c.category_id
      WHERE (v.status = 'SUBMITTED' AND v.dept_head_approver_id = ?)
         OR (v.status = 'DEPT_APPROVED' AND v.finance_approver_id = ?)
      ORDER BY v.created_at DESC
    `, [userId, userId]);

    // 장부 및 결산보고서의 경우 (전결라인 지정 컬럼이 없으므로 기존처럼 부서장/회계팀 역할 기반 필터 유지)
    if (role === 'DEPARTMENT_HEAD') {
      ledgers = await query.all(`
        SELECT l.*, g.name as group_name, o.name as organization_name
        FROM ledgers l
        JOIN groups g ON l.group_id = g.group_id
        JOIN organizations o ON g.organization_id = o.organization_id
        JOIN users u ON u.group_id = g.group_id
        WHERE l.status = 'SUBMITTED' AND u.user_id = ?
        ORDER BY l.year_month DESC
      `, [userId]);

      reports = await query.all(`
        SELECT r.*, g.name as group_name, o.name as organization_name
        FROM settlement_reports r
        JOIN groups g ON r.group_id = g.group_id
        JOIN organizations o ON g.organization_id = o.organization_id
        JOIN users u ON u.group_id = g.group_id
        WHERE r.status = 'SUBMITTED' AND u.user_id = ?
        ORDER BY r.fiscal_year DESC, r.half_cycle DESC
      `, [userId]);
    } else if (role === 'SYSTEM_ADMIN' || role === 'AUDITOR') {
      ledgers = await query.all(`
        SELECT l.*, g.name as group_name, o.name as organization_name
        FROM ledgers l
        JOIN groups g ON l.group_id = g.group_id
        JOIN organizations o ON g.organization_id = o.organization_id
        WHERE l.status = 'DEPT_APPROVED'
        ORDER BY l.year_month DESC
      `);

      reports = await query.all(`
        SELECT r.*, g.name as group_name, o.name as organization_name
        FROM settlement_reports r
        JOIN groups g ON r.group_id = g.group_id
        JOIN organizations o ON g.organization_id = o.organization_id
        WHERE r.status = 'DEPT_APPROVED'
        ORDER BY r.fiscal_year DESC, r.half_cycle DESC
      `);
    } else if (role === 'FINANCE_MANAGER') {
      const { groupId } = req.user;
      ledgers = await query.all(`
        SELECT l.*, g.name as group_name, o.name as organization_name
        FROM ledgers l
        JOIN groups g ON l.group_id = g.group_id
        JOIN organizations o ON g.organization_id = o.organization_id
        WHERE l.status = 'DEPT_APPROVED' AND l.group_id = ?
        ORDER BY l.year_month DESC
      `, [groupId]);

      reports = await query.all(`
        SELECT r.*, g.name as group_name, o.name as organization_name
        FROM settlement_reports r
        JOIN groups g ON r.group_id = g.group_id
        JOIN organizations o ON g.organization_id = o.organization_id
        WHERE r.status = 'DEPT_APPROVED' AND r.group_id = ?
        ORDER BY r.fiscal_year DESC, r.half_cycle DESC
      `, [groupId]);
    }

    res.json({ vouchers, ledgers, reports });
  } catch (error) {
    console.error('Fetch pending approvals error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. 결재 처리 (디지털 텍스트 서명 signature 저장 기능 포함)
router.post('/action', authenticateToken, async (req, res) => {
  const { userId, role, name } = req.user;
  const { targetType, targetId, action, comment, signature } = req.body; 

  if (!targetType || !targetId || !action) {
    return res.status(400).json({ message: 'Missing targetType, targetId, or action' });
  }

  if (action === 'REJECT' && !comment) {
    return res.status(400).json({ message: 'Comment is required for rejection' });
  }

  // 디폴트 사인 문구 생성
  const finalSignature = signature || `${name} (인)`;

  try {
    let currentStatus;
    let deptId_head_approver = null;
    let finance_approver = null;
    let dbTable;
    let idColumn;

    if (targetType === 'VOUCHER') {
      dbTable = 'vouchers';
      idColumn = 'voucher_id';
      const item = await query.get('SELECT status, dept_head_approver_id, finance_approver_id FROM vouchers WHERE voucher_id = ?', [targetId]);
      if (!item) return res.status(404).json({ message: 'Voucher not found' });
      currentStatus = item.status;
      deptId_head_approver = item.dept_head_approver_id;
      finance_approver = item.finance_approver_id;
    } else if (targetType === 'LEDGER') {
      dbTable = 'ledgers';
      idColumn = 'ledger_id';
      const item = await query.get('SELECT status FROM ledgers WHERE ledger_id = ?', [targetId]);
      if (!item) return res.status(404).json({ message: 'Ledger not found' });
      currentStatus = item.status;
    } else if (targetType === 'SETTLEMENT') {
      dbTable = 'settlement_reports';
      idColumn = 'report_id';
      const item = await query.get('SELECT status FROM settlement_reports WHERE report_id = ?', [targetId]);
      if (!item) return res.status(404).json({ message: 'Settlement report not found' });
      currentStatus = item.status;
    }

    let nextStatus = currentStatus;
    let stepNumber = 1;

    // 결재 검증 (지정 결재자 확인)
    if (action === 'APPROVE') {
      if (currentStatus === 'SUBMITTED') {
        if (targetType === 'VOUCHER' && deptId_head_approver !== userId && role !== 'SYSTEM_ADMIN') {
          return res.status(403).json({ message: 'You are not the designated 1st approver (Department Head)' });
        }
        nextStatus = 'DEPT_APPROVED';
        stepNumber = 1;
      } else if (currentStatus === 'DEPT_APPROVED') {
        if (targetType === 'VOUCHER' && finance_approver !== userId && role !== 'SYSTEM_ADMIN') {
          return res.status(403).json({ message: 'You are not the designated final approver (Finance Head)' });
        }
        nextStatus = 'APPROVED';
        stepNumber = 2;
      } else {
        return res.status(400).json({ message: 'Document cannot be approved in its current state' });
      }
    } else if (action === 'REJECT') {
      if (currentStatus === 'SUBMITTED') {
        if (targetType === 'VOUCHER' && deptId_head_approver !== userId && role !== 'SYSTEM_ADMIN') {
          return res.status(403).json({ message: 'You are not the designated approver' });
        }
        stepNumber = 1;
      } else if (currentStatus === 'DEPT_APPROVED') {
        if (targetType === 'VOUCHER' && finance_approver !== userId && role !== 'SYSTEM_ADMIN') {
          return res.status(403).json({ message: 'You are not the designated approver' });
        }
        stepNumber = 2;
      } else {
        return res.status(400).json({ message: 'Document cannot be rejected in its current state' });
      }
      nextStatus = 'REJECTED';
    }

    // 결재 레코드
    let approval = await query.get('SELECT approval_id FROM approvals WHERE target_type = ? AND target_id = ?', [targetType, targetId]);
    let approvalId;

    if (!approval) {
      const appResult = await query.run(`
        INSERT INTO approvals (target_type, target_id, status, current_step)
        VALUES (?, ?, ?, ?)
      `, [targetType, targetId, nextStatus, stepNumber]);
      approvalId = appResult.id;
    } else {
      approvalId = approval.approval_id;
      await query.run(`
        UPDATE approvals SET status = ?, current_step = ?, updated_at = CURRENT_TIMESTAMP
        WHERE approval_id = ?
      `, [nextStatus, stepNumber, approvalId]);
    }

    // 결재 이력 추가 (사인 signature 포함)
    await query.run(`
      INSERT INTO approval_histories (approval_id, actor_id, action, step_number, comment, signature)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [approvalId, userId, action, stepNumber, comment || (action === 'APPROVE' ? '승인 완료' : '반려 처리'), finalSignature]);

    // 원본 상태 업데이트
    if (targetType === 'VOUCHER') {
      const approvedAtSql = nextStatus === 'APPROVED' ? ', approved_at = CURRENT_TIMESTAMP' : '';
      await query.run(`
        UPDATE vouchers 
        SET status = ?, reject_reason = ? ${approvedAtSql}, updated_at = CURRENT_TIMESTAMP
        WHERE voucher_id = ?
      `, [nextStatus, action === 'REJECT' ? comment : null, targetId]);

      // [추가] 결재 상태 변경 시 실시간 인앱 알림 송신
      const voucher = await query.get('SELECT writer_id, summary, amount FROM vouchers WHERE voucher_id = ?', [targetId]);
      if (voucher) {
        if (action === 'APPROVE') {
          if (nextStatus === 'DEPT_APPROVED') {
            if (finance_approver) {
              await createNotification(
                finance_approver,
                'APPROVAL_REQUEST',
                `1차 승인 완료된 전표의 최종 결재를 요청합니다. (적요: ${voucher.summary}, 금액: ${parseFloat(voucher.amount).toLocaleString()}원)`,
                `/vouchers/${targetId}`
              );
            }
          } else if (nextStatus === 'APPROVED') {
            await createNotification(
              voucher.writer_id,
              'APPROVED',
              `상신하신 전표 결재가 최종 승인되었습니다. (적요: ${voucher.summary}, 금액: ${parseFloat(voucher.amount).toLocaleString()}원)`,
              `/vouchers/${targetId}`
            );
          }
        } else if (action === 'REJECT') {
          await createNotification(
            voucher.writer_id,
            'REJECTED',
            `상신하신 전표가 반려되었습니다. (사유: ${comment}, 적요: ${voucher.summary})`,
            `/vouchers/${targetId}`
          );
        }
      }
    } else {
      await query.run(`
        UPDATE ${dbTable} 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE ${idColumn} = ?
      `, [nextStatus, targetId]);
    }

    await query.run(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_position, target_id, result)
      VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS')
    `, [userId, `APPROVAL_${action}`, `${targetType} (ID: ${targetId}) 상태를 ${nextStatus}(으)로 변경 완료`, req.ip, req.user.position, targetId]);

    res.json({ message: `Successfully ${action === 'APPROVE' ? 'approved' : 'rejected'}`, nextStatus });
  } catch (error) {
    console.error('Process approval action error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2.5 일괄 결재 처리
router.post('/batch-action', authenticateToken, async (req, res) => {
  const { userId, role, name, position } = req.user;
  const { targetType, targetIds, action, comment, signature } = req.body;

  if (!targetType || !targetIds || !Array.isArray(targetIds) || targetIds.length === 0 || !action) {
    return res.status(400).json({ message: 'Missing targetType, targetIds (array), or action' });
  }

  if (action === 'REJECT' && !comment) {
    return res.status(400).json({ message: 'Comment is required for rejection' });
  }

  const finalSignature = signature || `${name} (${position}) (인)`;
  const results = [];
  const errors = [];

  for (const targetId of targetIds) {
    try {
      let currentStatus;
      let deptId_head_approver = null;
      let finance_approver = null;

      if (targetType === 'VOUCHER') {
        const item = await query.get('SELECT status, dept_head_approver_id, finance_approver_id FROM vouchers WHERE voucher_id = ?', [targetId]);
        if (!item) {
          errors.push({ targetId, message: '전표를 찾을 수 없습니다.' });
          continue;
        }
        currentStatus = item.status;
        deptId_head_approver = item.dept_head_approver_id;
        finance_approver = item.finance_approver_id;
      } else {
        errors.push({ targetId, message: '일괄 결재는 전표(VOUCHER) 대상만 지원됩니다.' });
        continue;
      }

      let nextStatus = currentStatus;
      let stepNumber = 1;

      // 결재 검증 (지정 결재자 확인)
      if (action === 'APPROVE') {
        if (currentStatus === 'SUBMITTED') {
          if (deptId_head_approver !== userId && role !== 'SYSTEM_ADMIN') {
            errors.push({ targetId, message: '지정된 1차 결재자(부서장)가 아닙니다.' });
            continue;
          }
          nextStatus = 'DEPT_APPROVED';
          stepNumber = 1;
        } else if (currentStatus === 'DEPT_APPROVED') {
          if (finance_approver !== userId && role !== 'SYSTEM_ADMIN') {
            errors.push({ targetId, message: '지정된 최종 결재자(회계팀장)가 아닙니다.' });
            continue;
          }
          nextStatus = 'APPROVED';
          stepNumber = 2;
        } else {
          errors.push({ targetId, message: '현재 상태에서는 승인할 수 없습니다.' });
          continue;
        }
      } else if (action === 'REJECT') {
        if (currentStatus === 'SUBMITTED') {
          if (deptId_head_approver !== userId && role !== 'SYSTEM_ADMIN') {
            errors.push({ targetId, message: '지정된 결재자가 아닙니다.' });
            continue;
          }
          stepNumber = 1;
        } else if (currentStatus === 'DEPT_APPROVED') {
          if (finance_approver !== userId && role !== 'SYSTEM_ADMIN') {
            errors.push({ targetId, message: '지정된 결재자가 아닙니다.' });
            continue;
          }
          stepNumber = 2;
        } else {
          errors.push({ targetId, message: '현재 상태에서는 반려할 수 없습니다.' });
          continue;
        }
        nextStatus = 'REJECTED';
      }

      // 결재 레코드 생성/수정
      let approval = await query.get('SELECT approval_id FROM approvals WHERE target_type = ? AND target_id = ?', [targetType, targetId]);
      let approvalId;

      if (!approval) {
        const appResult = await query.run(`
          INSERT INTO approvals (target_type, target_id, status, current_step)
          VALUES (?, ?, ?, ?)
        `, [targetType, targetId, nextStatus, stepNumber]);
        approvalId = appResult.id;
      } else {
        approvalId = approval.approval_id;
        await query.run(`
          UPDATE approvals SET status = ?, current_step = ?, updated_at = CURRENT_TIMESTAMP
          WHERE approval_id = ?
        `, [nextStatus, stepNumber, approvalId]);
      }

      // 결재 이력 추가
      await query.run(`
        INSERT INTO approval_histories (approval_id, actor_id, action, step_number, comment, signature)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [approvalId, userId, action, stepNumber, comment || (action === 'APPROVE' ? '승인 완료 (일괄)' : '반려 처리'), finalSignature]);

      // 원본 전표 상태 업데이트
      const approvedAtSql = nextStatus === 'APPROVED' ? ', approved_at = CURRENT_TIMESTAMP' : '';
      await query.run(`
        UPDATE vouchers 
        SET status = ?, reject_reason = ? ${approvedAtSql}, updated_at = CURRENT_TIMESTAMP
        WHERE voucher_id = ?
      `, [nextStatus, action === 'REJECT' ? comment : null, targetId]);

      // 알림 송신
      const voucher = await query.get('SELECT writer_id, summary, amount FROM vouchers WHERE voucher_id = ?', [targetId]);
      if (voucher) {
        if (action === 'APPROVE') {
          if (nextStatus === 'DEPT_APPROVED') {
            if (finance_approver) {
              await createNotification(
                finance_approver,
                'APPROVAL_REQUEST',
                `1차 승인 완료된 전표의 최종 결재를 요청합니다. (적요: ${voucher.summary}, 금액: ${parseFloat(voucher.amount).toLocaleString()}원)`,
                `/vouchers/${targetId}`
              );
            }
          } else if (nextStatus === 'APPROVED') {
            await createNotification(
              voucher.writer_id,
              'APPROVED',
              `상신하신 전표 결재가 최종 승인되었습니다. (적요: ${voucher.summary}, 금액: ${parseFloat(voucher.amount).toLocaleString()}원)`,
              `/vouchers/${targetId}`
            );
          }
        } else if (action === 'REJECT') {
          await createNotification(
            voucher.writer_id,
            'REJECTED',
            `상신하신 전표가 반려되었습니다. (사유: ${comment}, 적요: ${voucher.summary})`,
            `/vouchers/${targetId}`
          );
        }
      }

      // 시스템 로그 적재
      await query.run(`
        INSERT INTO system_logs (user_id, action, details, ip_address, user_position, target_id, result)
        VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS')
      `, [userId, `APPROVAL_BATCH_${action}`, `전표 ID: ${targetId} 일괄 ${action === 'APPROVE' ? '승인' : '반려'} 완료 (상태: ${nextStatus}) [적요: ${voucher ? voucher.summary : '-'}, 금액: ${voucher ? parseFloat(voucher.amount).toLocaleString() : '-'}원]`, req.ip, position, targetId]);

      results.push(targetId);
    } catch (err) {
      console.error(`Batch action error for ID ${targetId}:`, err);
      errors.push({ targetId, message: err.message });
    }
  }

  res.json({
    message: `일괄 결재 처리가 완료되었습니다. (성공: ${results.length}건, 실패: ${errors.length}건)`,
    successIds: results,
    errors
  });
});


// 3. 결재 이력 조회
router.get('/history/:targetType/:targetId', authenticateToken, async (req, res) => {
  const { targetType, targetId } = req.params;
  try {
    const histories = await query.all(`
      SELECT h.*, u.name as actor_name, u.role as actor_role, u.position as actor_position
      FROM approval_histories h
      JOIN approvals a ON h.approval_id = a.approval_id
      JOIN users u ON h.actor_id = u.user_id
      WHERE a.target_type = ? AND a.target_id = ?
      ORDER BY h.created_at ASC
    `, [targetType.toUpperCase(), targetId]);

    res.json(histories);
  } catch (error) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
