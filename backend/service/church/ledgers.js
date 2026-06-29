const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { query } = require('../../core/db');
const { authenticateToken } = require('../../core/auth');
const { enforceContextSecurity } = require('./contextScope');

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

// 1. 월별 장부 조회
router.get('/', authenticateToken, enforceContextSecurity, async (req, res) => {
  const { group, org, yearMonth } = req.query; // format: 'YYYY-MM'
  const scope = req.contextScope;

  if (!yearMonth) {
    return res.status(400).json({ message: 'yearMonth is required' });
  }

  let targetGroupId = group ? parseInt(group, 10) : null;
  let targetOrgId = org ? parseInt(org, 10) : null;

  if (!scope.canViewChurchWide) {
    if (targetGroupId) {
      if (!scope.allowedGroupIds.includes(targetGroupId)) {
        return res.status(403).json({ error: 'FORBIDDEN_CONTEXT', message: '해당 조직 범위의 데이터를 조회할 권한이 없습니다.' });
      }
    } else if (targetOrgId) {
      if (!scope.allowedCommitteeIds.includes(targetOrgId)) {
        return res.status(403).json({ error: 'FORBIDDEN_CONTEXT', message: '해당 조직 범위의 데이터를 조회할 권한이 없습니다.' });
      }
    } else {
      if (scope.role === 'FINANCE_MANAGER' && scope.allowedCommitteeIds.length > 0) {
        targetOrgId = scope.allowedCommitteeIds[0];
      } else if (scope.allowedGroupIds.length > 0) {
        targetGroupId = scope.allowedGroupIds[0];
      }
    }
  }

  try {
    const projectId = await getActiveProjectId(req);
    // Calculate carryOver from previous month
    const [year, monthStr] = yearMonth.split('-');
    const month = parseInt(monthStr, 10);
    let prevYearMonth = '';
    if (month === 1) {
      prevYearMonth = `${parseInt(year, 10) - 1}-12`;
    } else {
      const prevMonth = month - 1;
      prevYearMonth = `${year}-${prevMonth < 10 ? '0' + prevMonth : prevMonth}`;
    }

    let carryOver = 0.00;
    
    if (targetGroupId) {
      const prevLedger = await query.get(`
        SELECT balance FROM church_ledgers 
        WHERE department_id = ? AND year_month = ? AND project_id = ?
      `, [targetGroupId, prevYearMonth, projectId]);

      if (prevLedger) {
        carryOver = parseFloat(prevLedger.balance);
      } else {
        const baseCarry = await query.get(`
          SELECT carry_over FROM church_ledgers 
          WHERE department_id = ? AND year_month = ? AND project_id = ?
        `, [targetGroupId, yearMonth, projectId]);
        if (baseCarry) carryOver = parseFloat(baseCarry.carry_over);
      }
    } else {
      let carrySql = 'SELECT SUM(balance) as sum_balance FROM church_ledgers WHERE year_month = ? AND project_id = ?';
      const carryParams = [prevYearMonth, projectId];
      
      if (targetOrgId) {
        carrySql = `
          SELECT SUM(l.balance) as sum_balance 
          FROM church_ledgers l
          JOIN church_departments g ON l.department_id = g.department_id
          WHERE l.year_month = ? AND g.parent_id = ? AND l.project_id = ?
        `;
        carryParams.push(targetOrgId);
      }
      
      const prevSum = await query.get(carrySql, carryParams);
      carryOver = prevSum?.sum_balance ? parseFloat(prevSum.sum_balance) : 0.00;
    }

    // Fetch approved vouchers with their items amount summed
    let voucherSql = `
      SELECT v.*, c.parent_category, c.child_category, g.name as group_name,
             COALESCE((SELECT SUM(amount) FROM church_voucher_items WHERE voucher_id = v.voucher_id), 0.00) as amount
      FROM church_vouchers v
      JOIN church_departments g ON v.department_id = g.department_id
      JOIN church_voucher_items vi ON v.voucher_id = vi.voucher_id
      JOIN church_account_categories c ON vi.category_id = c.category_id
      WHERE v.status = 'APPROVED' AND to_char(v.transaction_date, 'YYYY-MM') = ? AND v.project_id = ?
    `;
    const voucherParams = [yearMonth, projectId];

    if (targetGroupId) {
      voucherSql += ' AND v.department_id = ?';
      voucherParams.push(targetGroupId);
    } else if (targetOrgId) {
      voucherSql += ' AND g.parent_id = ?';
      voucherParams.push(targetOrgId);
    }

    voucherSql += ' ORDER BY v.transaction_date ASC, v.voucher_id ASC';
    const vouchers = await query.all(voucherSql, voucherParams);

    let runningBalance = carryOver;
    let totalIncome = 0.00;
    let totalExpense = 0.00;

    const ledgerDetails = vouchers.map(v => {
      const inc = v.transaction_type === 'INCOME' ? parseFloat(v.amount) : 0.00;
      const exp = v.transaction_type === 'EXPENSE' ? parseFloat(v.amount) : 0.00;
      totalIncome += inc;
      totalExpense += exp;
      runningBalance = runningBalance + inc - exp;

      const transDate = v.transaction_date instanceof Date 
        ? v.transaction_date.toISOString().split('T')[0] 
        : v.transaction_date;

      return {
        voucher_id: v.voucher_id,
        transaction_date: transDate,
        parent_category: v.parent_category,
        child_category: v.child_category,
        summary: `[${v.group_name}] ${v.summary}`,
        vendor: v.vendor,
        income: inc,
        expense: exp,
        balance: runningBalance
      };
    });

    const finalBalance = carryOver + totalIncome - totalExpense;

    // Monthly closing insert/update for group
    if (targetGroupId) {
      const existingLedger = await query.get('SELECT ledger_id, status FROM church_ledgers WHERE department_id = ? AND year_month = ? AND project_id = ?', [targetGroupId, yearMonth, projectId]);
      if (existingLedger) {
        if (existingLedger.status !== 'APPROVED') {
          await query.run(`
            UPDATE church_ledgers 
            SET carry_over = ?, total_income = ?, total_expense = ?, balance = ?, updated_at = CURRENT_TIMESTAMP
            WHERE ledger_id = ?
          `, [carryOver, totalIncome, totalExpense, finalBalance, existingLedger.ledger_id]);
        }
      } else {
        await query.run(`
          INSERT INTO church_ledgers (project_id, department_id, year_month, carry_over, total_income, total_expense, balance, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'TEMP')
        `, [projectId, targetGroupId, yearMonth, carryOver, totalIncome, totalExpense, finalBalance]);
      }
    }

    res.json({
      group_id: targetGroupId || 'ALL',
      organization_id: targetOrgId || 'ALL',
      year_month: yearMonth,
      carry_over: carryOver,
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: finalBalance,
      items: ledgerDetails
    });
  } catch (error) {
    console.error('Ledger calculation error:', error);
    res.status(500).json({ message: 'Database query failed' });
  }
});

// 2. 월별 장부 마감 상신 (SUBMITTED)
router.post('/close', authenticateToken, async (req, res) => {
  const { groupId } = getAccountingUser(req);
  const { yearMonth } = req.body;

  if (!yearMonth) return res.status(400).json({ message: 'yearMonth is required' });

  try {
    const projectId = await getActiveProjectId(req);
    const ledger = await query.get('SELECT ledger_id, status FROM church_ledgers WHERE department_id = ? AND year_month = ? AND project_id = ?', [groupId, yearMonth, projectId]);
    if (!ledger) {
      return res.status(404).json({ message: '해당 월의 장부 내역이 없어 마감할 수 없습니다.' });
    }
    if (ledger.status !== 'TEMP' && ledger.status !== 'REJECTED') {
      return res.status(400).json({ message: '이미 마감되었거나 상신 대기중입니다.' });
    }

    // Update status to SUBMITTED
    await query.run("UPDATE church_ledgers SET status = 'SUBMITTED', updated_at = CURRENT_TIMESTAMP WHERE ledger_id = ?", [ledger.ledger_id]);

    // platform_audit_logs
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, service_id, project_id, action, details, ip_address, result)
      VALUES (?, 'church_think', ?, 'CLOSE_LEDGER_SUBMIT', ?, ?, 'SUCCESS')
    `, [req.user.userId, projectId, `${yearMonth} 장부 마감 상신 완료`, req.ip]);

    res.json({ message: '장부 마감 상신이 성공적으로 완료되었습니다.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 3. 반기/연도별 결산보고서 생성 및 조회
router.get('/settlement', authenticateToken, enforceContextSecurity, async (req, res) => {
  const { group, fiscalYear, halfCycle } = req.query; // halfCycle: 'FIRST', 'SECOND', 'YEAR'
  const scope = req.contextScope;

  if (!fiscalYear || !halfCycle) {
    return res.status(400).json({ message: 'fiscalYear and halfCycle are required' });
  }

  let targetGroupId = group ? parseInt(group, 10) : null;
  if (!scope.canViewChurchWide) {
    if (targetGroupId) {
      if (!scope.allowedGroupIds.includes(targetGroupId)) {
        return res.status(403).json({ error: 'FORBIDDEN_CONTEXT', message: '해당 조직 범위의 데이터를 조회할 권한이 없습니다.' });
      }
    } else {
      if (scope.allowedGroupIds.length > 0) {
        targetGroupId = scope.allowedGroupIds[0];
      }
    }
  }

  if (!targetGroupId) {
    return res.status(400).json({ message: 'Group ID is required for settlement reports' });
  }

  try {
    const projectId = await getActiveProjectId(req);
    const fYear = parseInt(fiscalYear, 10);
    // Find or create settlement report
    let report = await query.get('SELECT * FROM church_settlements WHERE department_id = ? AND fiscal_year = ? AND half_cycle = ? AND project_id = ?', [targetGroupId, fYear, halfCycle, projectId]);
    
    // Calculate report statistics
    let months = [];
    if (halfCycle === 'FIRST') {
      months = ['01', '02', '03', '04', '05', '06'].map(m => `${fiscalYear}-${m}`);
    } else if (halfCycle === 'SECOND') {
      months = ['07', '08', '09', '10', '11', '12'].map(m => `${fiscalYear}-${m}`);
    } else {
      months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => `${fiscalYear}-${m}`);
    }

    const monthPlaceholders = months.map(() => '?').join(',');
    const monthStats = await query.get(`
      SELECT SUM(total_income) as income, SUM(total_expense) as expense, SUM(balance) as bal
      FROM church_ledgers
      WHERE department_id = ? AND year_month IN (${monthPlaceholders}) AND project_id = ?
    `, [targetGroupId, ...months, projectId]);

    const totalIncome = parseFloat(monthStats?.income || 0);
    const totalExpense = parseFloat(monthStats?.expense || 0);
    const balance = totalIncome - totalExpense;

    if (report) {
      if (report.status !== 'APPROVED') {
        await query.run(`
          UPDATE church_settlements 
          SET total_income = ?, total_expense = ?, balance = ?, updated_at = CURRENT_TIMESTAMP
          WHERE settlement_id = ?
        `, [totalIncome, totalExpense, balance, report.settlement_id]);
      }
    } else {
      const budget = 10000000; // Default Mock Budget: 10,000,000 KRW
      const result = await query.run(`
        INSERT INTO church_settlements (project_id, department_id, fiscal_year, half_cycle, budget_amount, total_income, total_expense, balance, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'TEMP')
        RETURNING settlement_id
      `, [projectId, targetGroupId, fYear, halfCycle, budget, totalIncome, totalExpense, balance]);
      report = { settlement_id: result.id, department_id: targetGroupId, fiscal_year: fYear, half_cycle: halfCycle, budget_amount: budget, total_income: totalIncome, total_expense: totalExpense, balance, status: 'TEMP' };
    }

    res.json({
      report_id: report.settlement_id,
      group_id: targetGroupId,
      fiscal_year: fYear,
      half_cycle: halfCycle,
      budget_amount: report.budget_amount,
      total_income: totalIncome,
      total_expense: totalExpense,
      balance,
      status: report.status,
      note: report.note || ''
    });
  } catch (error) {
    console.error('Settlement error:', error);
    res.status(500).json({ message: 'Database query failed' });
  }
});

// 4. 결산보고서 상신
router.post('/settlement/submit', authenticateToken, async (req, res) => {
  const { groupId } = getAccountingUser(req);
  const { reportId } = req.body;

  if (!reportId) return res.status(400).json({ message: 'reportId is required' });

  try {
    const projectId = await getActiveProjectId(req);
    const report = await query.get('SELECT * FROM church_settlements WHERE settlement_id = ? AND department_id = ? AND project_id = ?', [reportId, groupId, projectId]);
    if (!report) {
      return res.status(404).json({ message: '해당 결산보고서가 없거나 편집 권한이 없습니다.' });
    }
    if (report.status !== 'TEMP' && report.status !== 'REJECTED') {
      return res.status(400).json({ message: '이미 제출되었거나 상신 대기중입니다.' });
    }

    await query.run("UPDATE church_settlements SET status = 'SUBMITTED', updated_at = CURRENT_TIMESTAMP WHERE settlement_id = ?", [reportId]);

    // platform_audit_logs
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, service_id, project_id, action, details, ip_address, result)
      VALUES (?, 'church_think', ?, 'CLOSE_SETTLEMENT_SUBMIT', ?, ?, 'SUCCESS')
    `, [req.user.userId, projectId, `${report.fiscal_year}년 ${report.half_cycle} 결산 상신 완료`, req.ip]);

    res.json({ message: '결산보고서 상신이 성공적으로 완료되었습니다.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 5. 회계 장부 엑셀 내보내기 (ExcelJS)
router.get('/export-excel', authenticateToken, enforceContextSecurity, async (req, res) => {
  const { group, yearMonth } = req.query;
  const scope = req.contextScope;

  if (!yearMonth) {
    return res.status(400).send('yearMonth is required');
  }

  let targetGroupId = group ? parseInt(group, 10) : null;
  if (!scope.canViewChurchWide) {
    if (targetGroupId) {
      if (!scope.allowedGroupIds.includes(targetGroupId)) {
        return res.status(403).send('해당 조직 범위의 데이터를 조회할 권한이 없습니다.');
      }
    } else {
      if (scope.allowedGroupIds.length > 0) {
        targetGroupId = scope.allowedGroupIds[0];
      }
    }
  }

  if (!targetGroupId) {
    return res.status(400).send('Group ID is required for Excel export');
  }

  try {
    const projectId = await getActiveProjectId(req);
    const groupInfo = await query.get('SELECT name FROM church_departments WHERE department_id = ? AND project_id = ?', [targetGroupId, projectId]);
    
    // Carry over calculation
    const [year, monthStr] = yearMonth.split('-');
    const month = parseInt(monthStr, 10);
    let prevYearMonth = '';
    if (month === 1) {
      prevYearMonth = `${parseInt(year, 10) - 1}-12`;
    } else {
      const prevMonth = month - 1;
      prevYearMonth = `${year}-${prevMonth < 10 ? '0' + prevMonth : prevMonth}`;
    }

    let carryOver = 0.00;
    const prevLedger = await query.get('SELECT balance FROM church_ledgers WHERE department_id = ? AND year_month = ? AND project_id = ?', [targetGroupId, prevYearMonth, projectId]);
    if (prevLedger) carryOver = parseFloat(prevLedger.balance);

    const vouchers = await query.all(`
      SELECT v.*, c.parent_category, c.child_category, g.name as group_name,
             COALESCE((SELECT SUM(amount) FROM church_voucher_items WHERE voucher_id = v.voucher_id), 0.00) as amount
      FROM church_vouchers v
      JOIN church_departments g ON v.department_id = g.department_id
      JOIN church_voucher_items vi ON v.voucher_id = vi.voucher_id
      JOIN church_account_categories c ON vi.category_id = c.category_id
      WHERE v.status = 'APPROVED' AND v.department_id = ? AND to_char(v.transaction_date, 'YYYY-MM') = ? AND v.project_id = ?
      ORDER BY v.transaction_date ASC, v.voucher_id ASC
    `, [targetGroupId, yearMonth, projectId]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('현금출납부');

    // Excel Style settings
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${groupInfo?.name || '소속부서'} ${yearMonth} 현금출납장`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.getRow(1).height = 40;

    // Header row
    const headers = ['거래일자', '전표번호', '계정과목(대)', '계정과목(중)', '적요', '수입(원)', '지출(원)', '잔액(원)'];
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(2);
    headerRow.font = { bold: true };
    headerRow.height = 25;
    
    // Add carry over row
    worksheet.addRow([yearMonth + '-01', '-', '이월금', '전월이월금', '전월 이월 금액', carryOver, 0, carryOver]);

    let runningBalance = carryOver;
    let totalIncome = 0;
    let totalExpense = 0;

    vouchers.forEach(v => {
      const inc = v.transaction_type === 'INCOME' ? parseFloat(v.amount) : 0;
      const exp = v.transaction_type === 'EXPENSE' ? parseFloat(v.amount) : 0;
      runningBalance = runningBalance + inc - exp;
      totalIncome += inc;
      totalExpense += exp;

      const transDate = v.transaction_date instanceof Date 
        ? v.transaction_date.toISOString().split('T')[0] 
        : v.transaction_date;

      worksheet.addRow([
        transDate,
        v.voucher_id,
        v.parent_category,
        v.child_category,
        v.summary,
        inc,
        exp,
        runningBalance
      ]);
    });

    // Add summary row
    worksheet.addRow(['합계', '', '', '', '당월 수지 합계', totalIncome, totalExpense, runningBalance]);

    // Formatting columns
    worksheet.columns.forEach((col, idx) => {
      if (idx === 0) col.width = 15; // Date
      else if (idx === 4) col.width = 30; // Summary
      else if (idx >= 5) {
        col.width = 15;
        col.numFmt = '#,##0'; // Currency formatting
      } else col.width = 12;
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=ledger_${yearMonth}_${encodeURIComponent(groupInfo?.name || 'group')}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).send('Excel export failed');
  }
});

module.exports = router;
