const express = require('express');
const router = express.Router();
const { query } = require('../../core/db');
const { authenticateToken } = require('../../core/auth');

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

// 1. 결재 대기 문서 목록 조회
router.get('/pending', authenticateToken, async (req, res) => {
  if (!req.user.accounting?.activeContext && !req.user.isAdmin) {
    return res.status(403).json({ error: 'FORBIDDEN_CONTEXT', message: '승인된 조직 배정이 없습니다.' });
  }
  const { userId, role, groupId, isSystemAdmin, hasGlobalAccess } = getAccountingUser(req);

  try {
    const projectId = await getActiveProjectId(req);
    let vouchers = [];
    let ledgers = [];
    let reports = [];

    // Vouchers where user is designated approver in church_approval_lines
    vouchers = await query.all(`
      SELECT DISTINCT v.*, d.name as group_name, o.name as organization_name, u.display_name as writer_name, 
             c.parent_category, c.child_category, l.step_number, l.line_id,
             COALESCE((SELECT SUM(amount) FROM church_voucher_items WHERE voucher_id = v.voucher_id), 0.00) as amount
      FROM church_approval_lines l
      JOIN church_vouchers v ON l.voucher_id = v.voucher_id
      JOIN church_departments d ON v.department_id = d.department_id
      LEFT JOIN church_departments o ON d.parent_id = o.department_id
      JOIN platform_profiles u ON v.writer_id = u.user_id
      JOIN church_voucher_items vi ON v.voucher_id = vi.voucher_id
      JOIN church_account_categories c ON vi.category_id = c.category_id
      WHERE l.approver_id = ? AND l.status = 'PENDING' AND v.project_id = ? AND v.status IN ('pending_approval', 'SUBMITTED')
      ORDER BY v.created_at DESC
    `, [userId, projectId]);

    // Ledgers and settlement reports pending approval (role-based)
    if (role === 'DEPARTMENT_HEAD') {
      ledgers = await query.all(`
        SELECT l.*, d.name as group_name, o.name as organization_name
        FROM church_ledgers l
        JOIN church_departments d ON l.department_id = d.department_id
        LEFT JOIN church_departments o ON d.parent_id = o.department_id
        JOIN church_user_metadata m ON m.department_id = d.department_id
        WHERE l.status = 'SUBMITTED' AND m.user_id = ? AND l.project_id = ?
        ORDER BY l.year_month DESC
      `, [userId, projectId]);

      reports = await query.all(`
        SELECT r.*, d.name as group_name, o.name as organization_name
        FROM church_settlements r
        JOIN church_departments d ON r.department_id = d.department_id
        LEFT JOIN church_departments o ON d.parent_id = o.department_id
        JOIN church_user_metadata m ON m.department_id = d.department_id
        WHERE r.status = 'SUBMITTED' AND m.user_id = ? AND r.project_id = ?
        ORDER BY r.fiscal_year DESC, r.half_cycle DESC
      `, [userId, projectId]);
    } else if (hasGlobalAccess) {
      ledgers = await query.all(`
        SELECT l.*, d.name as group_name, o.name as organization_name
        FROM church_ledgers l
        JOIN church_departments d ON l.department_id = d.department_id
        LEFT JOIN church_departments o ON d.parent_id = o.department_id
        WHERE l.status = 'DEPT_APPROVED' OR l.status = 'SUBMITTED' AND l.project_id = ?
        ORDER BY l.year_month DESC
      `, [projectId]);

      reports = await query.all(`
        SELECT r.*, d.name as group_name, o.name as organization_name
        FROM church_settlements r
        JOIN church_departments d ON r.department_id = d.department_id
        LEFT JOIN church_departments o ON d.parent_id = o.department_id
        WHERE r.status = 'DEPT_APPROVED' OR r.status = 'SUBMITTED' AND r.project_id = ?
        ORDER BY r.fiscal_year DESC, r.half_cycle DESC
      `, [projectId]);
    } else if (role === 'FINANCE_MANAGER') {
      ledgers = await query.all(`
        SELECT l.*, d.name as group_name, o.name as organization_name
        FROM church_ledgers l
        JOIN church_departments d ON l.department_id = d.department_id
        LEFT JOIN church_departments o ON d.parent_id = o.department_id
        WHERE l.status = 'DEPT_APPROVED' AND l.department_id = ? AND l.project_id = ?
        ORDER BY l.year_month DESC
      `, [groupId, projectId]);

      reports = await query.all(`
        SELECT r.*, d.name as group_name, o.name as organization_name
        FROM church_settlements r
        JOIN church_departments d ON r.department_id = d.department_id
        LEFT JOIN church_departments o ON d.parent_id = o.department_id
        WHERE r.status = 'DEPT_APPROVED' AND r.department_id = ? AND r.project_id = ?
        ORDER BY r.fiscal_year DESC, r.half_cycle DESC
      `, [groupId, projectId]);
    }

    // Remap ledgers report fields for API compatibility (ledger_id, report_id)
    ledgers.forEach(item => {
      item.ledger_id = item.ledger_id;
    });
    reports.forEach(item => {
      item.report_id = item.settlement_id;
    });

    res.json({ vouchers, ledgers, reports });
  } catch (error) {
    console.error('Fetch pending approvals error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. 결재 처리
router.post('/action', authenticateToken, async (req, res) => {
  if (!req.user.accounting?.activeContext && !req.user.isAdmin) {
    return res.status(403).json({ error: 'FORBIDDEN_CONTEXT', message: '승인된 조직 배정이 없습니다.' });
  }
  const { userId, role, isSystemAdmin } = getAccountingUser(req);
  const { targetType, targetId, action, comment, signature } = req.body; 

  if (!targetType || !targetId || !action) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  try {
    const projectId = await getActiveProjectId(req);
    let current_status = 'TEMP';
    let voucherObj = null;

    if (targetType === 'VOUCHER') {
        const activeLine = await query.get(
          'SELECT * FROM church_approval_lines WHERE voucher_id = ? AND approver_id = ? AND status = \'PENDING\'',
          [targetId, userId]
        );

        if (!activeLine && !isSystemAdmin) {
          return res.status(403).json({ message: '결재 권한이 없거나 대기 중인 결재선이 아닙니다.' });
        }

        const stepNumber = activeLine ? activeLine.step_number : 1;
        const lineId = activeLine ? activeLine.line_id : null;

        if (lineId) {
          await query.run(
            "UPDATE church_approval_lines SET status = 'APPROVED', approved_at = CURRENT_TIMESTAMP WHERE line_id = ?",
            [lineId]
          );
        }

        const nextLine = await query.get(
          'SELECT * FROM church_approval_lines WHERE voucher_id = ? AND step_number > ? ORDER BY step_number ASC LIMIT 1',
          [targetId, stepNumber]
        );

        if (nextLine) {
          await query.run("UPDATE church_approval_lines SET status = 'PENDING' WHERE line_id = ?", [nextLine.line_id]);
        } else {
          const nextStatus = 'approved';
          await updateTargetStatus(targetType, targetId, nextStatus, null, projectId);
        }

        await query.run(`
          INSERT INTO church_approval_actions (voucher_id, actor_id, action, comment, signature)
          VALUES (?, ?, 'APPROVE', ?, ?)
        `, [targetId, userId, comment || `제 ${stepNumber}단계 승인 완료`, signature || null]);

        res.json({ message: '결재 승인이 성공적으로 완료되었습니다.' });
      } else {
        // Ledgers and Reports approvals
        if (current_status === 'SUBMITTED') {
          if (role !== 'DEPARTMENT_HEAD' && !isSystemAdmin) {
            return res.status(403).json({ message: '부서장 승인 권한이 없습니다.' });
          }
          await updateTargetStatus(targetType, targetId, 'DEPT_APPROVED', null, projectId);
          res.json({ message: '부서장 1차 결재가 승인되었습니다.' });
        } else if (current_status === 'DEPT_APPROVED') {
          if (role !== 'FINANCE_MANAGER' && !isSystemAdmin && role !== 'AUDITOR') {
            return res.status(403).json({ message: '최종 승인 권한이 없습니다.' });
          }
          await updateTargetStatus(targetType, targetId, 'APPROVED', null, projectId);
          res.json({ message: '최종 결산 승인이 완료되었습니다.' });
        } else {
          return res.status(400).json({ message: '결재 가능한 상태가 아닙니다.' });
        }
      }

    } else if (action === 'REJECT') {
      if (current_status !== 'pending_approval' && current_status !== 'SUBMITTED' && current_status !== 'DEPT_APPROVED') {
        return res.status(400).json({ message: '반려할 수 없는 상태입니다.' });
      }
      
      const newStatus = 'rejected';
      await updateTargetStatus(targetType, targetId, newStatus, comment || '결재 반려', projectId);

      if (targetType === 'VOUCHER') {
        await query.run("UPDATE church_approval_lines SET status = 'REJECTED' WHERE voucher_id = ?", [targetId]);
        await query.run(`
          INSERT INTO church_approval_actions (voucher_id, actor_id, action, comment, signature)
          VALUES (?, ?, 'REJECT', ?, ?)
        `, [targetId, userId, comment || '결재 반려 처리', signature || null]);
      }

      res.json({ message: '반려 처리가 완료되었습니다.' });
    } else if (action === 'CANCEL') {
      if (current_status !== 'pending_approval' && current_status !== 'SUBMITTED' && current_status !== 'DEPT_APPROVED') {
        return res.status(400).json({ message: '회수할 수 없는 상태입니다.' });
      }
      
      const newStatus = 'draft';
      await updateTargetStatus(targetType, targetId, newStatus, null, projectId);

      if (targetType === 'VOUCHER') {
        await query.run("UPDATE church_approval_lines SET status = 'WAITING' WHERE voucher_id = ?", [targetId]);
        await query.run("UPDATE church_approval_lines SET status = 'PENDING' WHERE voucher_id = ? AND step_number = 1", [targetId]);
        await query.run(`
          INSERT INTO church_approval_actions (voucher_id, actor_id, action, comment, signature)
          VALUES (?, ?, 'CANCEL', ?, ?)
        `, [targetId, userId, comment || '기안 상신 회수', signature || null]);
      }

      res.json({ message: '결재 회수가 완료되었습니다.' });
    }

  } catch (error) {
    console.error('Approval action error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

async function updateTargetStatus(type, id, status, rejectReason = null, projectId) {
  if (type === 'VOUCHER') {
    if (status === 'APPROVED') {
      await query.run('UPDATE church_vouchers SET status = ?, approved_at = CURRENT_TIMESTAMP WHERE voucher_id = ? AND project_id = ?', [status, id, projectId]);
    } else if (status === 'REJECTED') {
      await query.run('UPDATE church_vouchers SET status = ?, reject_reason = ? WHERE voucher_id = ? AND project_id = ?', [status, rejectReason, id, projectId]);
    } else {
      await query.run('UPDATE church_vouchers SET status = ? WHERE voucher_id = ? AND project_id = ?', [status, id, projectId]);
    }
  } else if (type === 'LEDGER') {
    await query.run('UPDATE church_ledgers SET status = ? WHERE ledger_id = ? AND project_id = ?', [status, id, projectId]);
  } else if (type === 'SETTLEMENT') {
    await query.run('UPDATE church_settlements SET status = ? WHERE settlement_id = ? AND project_id = ?', [status, id, projectId]);
  }
}

module.exports = router;
