const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { query } = require('./db');
const { authenticateToken } = require('./auth');

// 1. 월별 장부 조회 (실시간 계층형 집계)
router.get('/', authenticateToken, async (req, res) => {
  const { groupId, role } = req.user;
  const { group, org, yearMonth } = req.query; // yearMonth format: 'YYYY-MM'

  if (!yearMonth) {
    return res.status(400).json({ message: 'yearMonth is required' });
  }

  // 기본 권한 제어: ACCOUNTANT/DEPT_HEAD는 본인 소속 그룹 고정
  let targetGroupId = group ? parseInt(group, 10) : null;
  let targetOrgId = org ? parseInt(org, 10) : null;

  if (role !== 'SYSTEM_ADMIN' && role !== 'AUDITOR') {
    targetGroupId = groupId;
    targetOrgId = null; // 그룹 레벨만 조회
  }

  try {
    // 1-1. 전월 이월금 조회 및 계산
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
    
    // 그룹 특정 조회인 경우
    if (targetGroupId) {
      const prevLedger = await query.get(`
        SELECT balance FROM ledgers 
        WHERE group_id = ? AND year_month = ?
      `, [targetGroupId, prevYearMonth]);

      if (prevLedger) {
        carryOver = prevLedger.balance;
      } else {
        const baseCarry = await query.get(`
          SELECT carry_over FROM ledgers 
          WHERE group_id = ? AND year_month = ?
        `, [targetGroupId, yearMonth]);
        if (baseCarry) carryOver = baseCarry.carry_over;
      }
    } 
    // 위원회 단위 또는 전체 통합 조회인 경우 전월 이월금은 소속된 모든 하위 그룹들의 전월 이월금 합산
    else {
      let carrySql = 'SELECT SUM(balance) as sum_balance FROM ledgers WHERE year_month = ?';
      const carryParams = [prevYearMonth];
      
      if (targetOrgId) {
        carrySql = `
          SELECT SUM(l.balance) as sum_balance 
          FROM ledgers l
          JOIN groups g ON l.group_id = g.group_id
          WHERE l.year_month = ? AND g.organization_id = ?
        `;
        carryParams.push(targetOrgId);
      }
      
      const prevSum = await query.get(carrySql, carryParams);
      carryOver = prevSum?.sum_balance || 0.00;
    }

    // 1-2. 최종 승인(APPROVED)된 전표 목록 조회 (계층 구조 필터링)
    let voucherSql = `
      SELECT v.*, c.parent_category, c.child_category, g.name as group_name
      FROM vouchers v
      JOIN groups g ON v.group_id = g.group_id
      JOIN account_categories c ON v.category_id = c.category_id
      WHERE v.status = 'APPROVED' AND strftime('%Y-%m', v.transaction_date) = ?
    `;
    const voucherParams = [yearMonth];

    if (targetGroupId) {
      voucherSql += ' AND v.group_id = ?';
      voucherParams.push(targetGroupId);
    } else if (targetOrgId) {
      voucherSql += ' AND g.organization_id = ?';
      voucherParams.push(targetOrgId);
    }

    voucherSql += ' ORDER BY v.transaction_date ASC, v.voucher_id ASC';
    const vouchers = await query.all(voucherSql, voucherParams);

    // 1-3. 장부 아이템 연산
    let runningBalance = carryOver;
    let totalIncome = 0.00;
    let totalExpense = 0.00;

    const ledgerDetails = vouchers.map(v => {
      const inc = v.transaction_type === 'INCOME' ? v.amount : 0.00;
      const exp = v.transaction_type === 'EXPENSE' ? v.amount : 0.00;
      totalIncome += inc;
      totalExpense += exp;
      runningBalance = runningBalance + inc - exp;

      return {
        voucher_id: v.voucher_id,
        transaction_date: v.transaction_date,
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

    // 단일 그룹 조회일 때만 ledgers 테이블 마감 레코드 삽입/갱신 수행
    if (targetGroupId) {
      const existingLedger = await query.get('SELECT ledger_id, status FROM ledgers WHERE group_id = ? AND year_month = ?', [targetGroupId, yearMonth]);
      if (existingLedger) {
        if (existingLedger.status !== 'APPROVED') {
          await query.run(`
            UPDATE ledgers 
            SET carry_over = ?, total_income = ?, total_expense = ?, balance = ?, updated_at = CURRENT_TIMESTAMP
            WHERE ledger_id = ?
          `, [carryOver, totalIncome, totalExpense, finalBalance, existingLedger.ledger_id]);
        }
      } else {
        await query.run(`
          INSERT INTO ledgers (group_id, year_month, carry_over, total_income, total_expense, balance, status)
          VALUES (?, ?, ?, ?, ?, ?, 'TEMP')
        `, [targetGroupId, yearMonth, carryOver, totalIncome, totalExpense, finalBalance]);
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
      status: targetGroupId ? (await query.get('SELECT status FROM ledgers WHERE group_id = ? AND year_month = ?', [targetGroupId, yearMonth]))?.status || 'TEMP' : 'APPROVED',
      details: ledgerDetails
    });
  } catch (error) {
    console.error('Fetch ledger error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. 초기 이월금 강제 수동 설정
router.post('/carryover', authenticateToken, async (req, res) => {
  const { groupId } = req.user;
  const { group, yearMonth, carryOver } = req.body;

  if (!yearMonth || carryOver === undefined) {
    return res.status(400).json({ message: 'yearMonth and carryOver are required' });
  }

  const targetGroupId = group && (req.user.role === 'SYSTEM_ADMIN' || req.user.role === 'AUDITOR') ? parseInt(group, 10) : groupId;

  try {
    const existing = await query.get('SELECT ledger_id, status FROM ledgers WHERE group_id = ? AND year_month = ?', [targetGroupId, yearMonth]);
    
    if (existing && existing.status === 'APPROVED') {
      return res.status(400).json({ message: 'Cannot change carry over of an approved ledger' });
    }

    if (existing) {
      const balance = parseFloat(carryOver) + existing.total_income - existing.total_expense;
      await query.run(`
        UPDATE ledgers SET carry_over = ?, balance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE ledger_id = ?
      `, [parseFloat(carryOver), balance, existing.ledger_id]);
    } else {
      await query.run(`
        INSERT INTO ledgers (group_id, year_month, carry_over, total_income, total_expense, balance, status)
        VALUES (?, ?, ?, 0.00, 0.00, ?, 'TEMP')
      `, [targetGroupId, yearMonth, parseFloat(carryOver), parseFloat(carryOver)]);
    }

    res.json({ message: 'Carry over set successfully', carryOver: parseFloat(carryOver) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. 반기 결산보고서 실시간 조회
router.get('/settlement', authenticateToken, async (req, res) => {
  const { groupId, role } = req.user;
  const { group, org, year, half } = req.query;

  if (!year || !half) {
    return res.status(400).json({ message: 'year and half are required' });
  }

  let targetGroupId = group ? parseInt(group, 10) : null;
  let targetOrgId = org ? parseInt(org, 10) : null;

  if (role !== 'SYSTEM_ADMIN' && role !== 'AUDITOR') {
    targetGroupId = groupId;
    targetOrgId = null;
  }

  const months = half === 'FIRST' ? ['01', '02', '03', '04', '05', '06'] : ['07', '08', '09', '10', '11', '12'];
  const monthPlaceholders = months.map(m => `'${year}-${m}'`).join(',');

  try {
    let sql = `
      SELECT c.type, c.parent_category, c.child_category, SUM(v.amount) as total_amount
      FROM vouchers v
      JOIN groups g ON v.group_id = g.group_id
      JOIN account_categories c ON v.category_id = c.category_id
      WHERE v.status = 'APPROVED' AND strftime('%Y-%m', v.transaction_date) IN (${monthPlaceholders})
    `;
    const params = [];

    if (targetGroupId) {
      sql += ' AND v.group_id = ?';
      params.push(targetGroupId);
    } else if (targetOrgId) {
      sql += ' AND g.organization_id = ?';
      params.push(targetOrgId);
    }

    sql += ' GROUP BY c.type, c.parent_category, c.child_category ORDER BY c.type DESC, c.parent_category ASC';
    const items = await query.all(sql, params);

    const reportData = items.map(item => {
      const budget = 5000000.00;
      const actual = item.total_amount;
      const balance = item.type === 'EXPENSE' ? (budget - actual) : actual;
      const rate = item.type === 'EXPENSE' ? ((actual / budget) * 100).toFixed(1) : '100.0';

      return {
        type: item.type,
        parent_category: item.parent_category,
        child_category: item.child_category,
        budget_amount: budget,
        amount: actual,
        balance: balance,
        execution_rate: parseFloat(rate),
        note: ''
      };
    });

    res.json({
      group_id: targetGroupId || 'ALL',
      organization_id: targetOrgId || 'ALL',
      fiscal_year: parseInt(year, 10),
      half_cycle: half,
      details: reportData
    });
  } catch (error) {
    console.error('Fetch settlement report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 4. 월별 장부 엑셀 다운로드 (계층 구조 지원)
router.get('/excel', authenticateToken, async (req, res) => {
  const { group, org, yearMonth } = req.query;
  const { groupId, role } = req.user;

  let targetGroupId = group ? parseInt(group, 10) : null;
  let targetOrgId = org ? parseInt(org, 10) : null;

  if (role !== 'SYSTEM_ADMIN' && role !== 'AUDITOR') {
    targetGroupId = groupId;
    targetOrgId = null;
  }

  try {
    let titleName = '교회전체통합';
    if (targetGroupId) {
      const gInfo = await query.get('SELECT name FROM groups WHERE group_id = ?', [targetGroupId]);
      titleName = gInfo ? gInfo.name : '알수없는그룹';
    } else if (targetOrgId) {
      const oInfo = await query.get('SELECT name FROM organizations WHERE organization_id = ?', [targetOrgId]);
      titleName = oInfo ? oInfo.name + ' 통합' : '알수없는위원회';
    }

    // 전월 이월금 계산
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
      const prevLedger = await query.get('SELECT balance FROM ledgers WHERE group_id = ? AND year_month = ?', [targetGroupId, prevYearMonth]);
      if (prevLedger) carryOver = prevLedger.balance;
      else {
        const baseCarry = await query.get('SELECT carry_over FROM ledgers WHERE group_id = ? AND year_month = ?', [targetGroupId, yearMonth]);
        if (baseCarry) carryOver = baseCarry.carry_over;
      }
    } else {
      let carrySql = 'SELECT SUM(balance) as sum_balance FROM ledgers WHERE year_month = ?';
      const carryParams = [prevYearMonth];
      if (targetOrgId) {
        carrySql = `
          SELECT SUM(l.balance) as sum_balance 
          FROM ledgers l
          JOIN groups g ON l.group_id = g.group_id
          WHERE l.year_month = ? AND g.organization_id = ?
        `;
        carryParams.push(targetOrgId);
      }
      const prevSum = await query.get(carrySql, carryParams);
      carryOver = prevSum?.sum_balance || 0.00;
    }

    // 전표 리스트 조회
    let voucherSql = `
      SELECT v.*, c.parent_category, c.child_category, g.name as group_name
      FROM vouchers v
      JOIN groups g ON v.group_id = g.group_id
      JOIN account_categories c ON v.category_id = c.category_id
      WHERE v.status = 'APPROVED' AND strftime('%Y-%m', v.transaction_date) = ?
    `;
    const voucherParams = [yearMonth];

    if (targetGroupId) {
      voucherSql += ' AND v.group_id = ?';
      voucherParams.push(targetGroupId);
    } else if (targetOrgId) {
      voucherSql += ' AND g.organization_id = ?';
      voucherParams.push(targetOrgId);
    }
    voucherSql += ' ORDER BY v.transaction_date ASC, v.voucher_id ASC';
    const vouchers = await query.all(voucherSql, voucherParams);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${yearMonth} 장부`);

    worksheet.columns = [
      { header: '거래일자', key: 'date', width: 15 },
      { header: '대분류', key: 'parent', width: 15 },
      { header: '중분류', key: 'child', width: 15 },
      { header: '적요', key: 'summary', width: 35 },
      { header: '거래처/사용처', key: 'vendor', width: 20 },
      { header: '수입액', key: 'income', width: 15, style: { numFmt: '#,##0' } },
      { header: '지출액', key: 'expense', width: 15, style: { numFmt: '#,##0' } },
      { header: '잔액', key: 'balance', width: 18, style: { numFmt: '#,##0' } }
    ];

    worksheet.insertRow(1, []);
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${titleName} - ${yearMonth} 월별 회계 장부`;
    titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' }
    };
    worksheet.getRow(1).height = 40;

    const headerRow = worksheet.getRow(3);
    headerRow.values = ['거래일자', '대분류', '중분류', '적요', '거래처/사용처', '수입액', '지출액', '잔액'];
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    const carryOverRow = worksheet.addRow({
      date: '-',
      parent: '이월금',
      child: '전월이월금',
      summary: '전월 이월 금액',
      vendor: '-',
      income: 0,
      expense: 0,
      balance: carryOver
    });
    carryOverRow.getCell('A').alignment = { horizontal: 'center' };
    carryOverRow.eachCell((cell) => {
      cell.font = { italic: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    });

    let currentBalance = carryOver;
    let totalInc = 0;
    let totalExp = 0;

    vouchers.forEach(v => {
      const inc = v.transaction_type === 'INCOME' ? v.amount : 0;
      const exp = v.transaction_type === 'EXPENSE' ? v.amount : 0;
      totalInc += inc;
      totalExp += exp;
      currentBalance = currentBalance + inc - exp;

      const row = worksheet.addRow({
        date: v.transaction_date,
        parent: v.parent_category,
        child: v.child_category,
        summary: `[${v.group_name}] ${v.summary}`,
        vendor: v.vendor || '-',
        income: inc,
        expense: exp,
        balance: currentBalance
      });
      row.getCell('A').alignment = { horizontal: 'center' };
    });

    const sumRow = worksheet.addRow({
      date: '합계',
      parent: '-',
      child: '-',
      summary: '당월 수지 합계',
      vendor: '-',
      income: totalInc,
      expense: totalExp,
      balance: currentBalance
    });
    sumRow.getCell('A').alignment = { horizontal: 'center' };
    sumRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'double' }, right: { style: 'thin' } };
    });

    // 6. 영수증 이미지 첨부 기능 (영수증 증빙 시트 추가)
    if (vouchers.length > 0) {
      const voucherIds = vouchers.map(v => v.voucher_id);
      const placeholders = voucherIds.map(() => '?').join(',');
      const attachments = await query.all(`
        SELECT a.*, v.summary, v.transaction_date, v.vendor, v.amount, g.name as group_name
        FROM voucher_attachments a
        JOIN vouchers v ON a.voucher_id = v.voucher_id
        JOIN groups g ON v.group_id = g.group_id
        WHERE v.voucher_id IN (${placeholders})
        ORDER BY v.transaction_date ASC, a.sort_order ASC, a.attachment_id ASC
      `, voucherIds);

      if (attachments.length > 0) {
        const evidenceSheet = workbook.addWorksheet('영수증 증빙');
        evidenceSheet.columns = [
          { header: '전표 정보', key: 'info', width: 45 },
          { header: '영수증 이미지', key: 'image', width: 55 }
        ];

        // 타이틀 행 설정
        evidenceSheet.insertRow(1, []);
        evidenceSheet.mergeCells('A1:B1');
        const evTitleCell = evidenceSheet.getCell('A1');
        evTitleCell.value = `${titleName} - ${yearMonth} 영수증 증빙자료`;
        evTitleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        evTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        evTitleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1F4E79' }
        };
        evidenceSheet.getRow(1).height = 40;

        // 헤더 행 설정
        const evHeaderRow = evidenceSheet.getRow(3);
        evHeaderRow.values = ['전표 정보', '영수증 이미지'];
        evHeaderRow.height = 25;
        evHeaderRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        const uploadDir = path.join(__dirname, 'uploads');
        let currentRowNum = 4;

        for (const att of attachments) {
          const filePath = path.join(uploadDir, att.file_key);
          if (fs.existsSync(filePath)) {
            const infoText = [
              `일자: ${att.transaction_date}`,
              `부서: ${att.group_name}`,
              `상호: ${att.vendor || '-'}`,
              `금액: ${att.amount.toLocaleString()}원`,
              `적요: ${att.summary}`
            ].join('\n');

            const row = evidenceSheet.addRow({
              info: infoText,
              image: ''
            });
            row.height = 210; // 이미지 수용을 위한 행 높이 설정
            
            const infoCell = row.getCell('A');
            infoCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            infoCell.font = { size: 10 };
            infoCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

            const imgCell = row.getCell('B');
            imgCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

            try {
              let ext = 'png';
              if (att.file_key.toLowerCase().endsWith('.jpg') || att.file_key.toLowerCase().endsWith('.jpeg')) {
                ext = 'jpeg';
              }

              const imgId = workbook.addImage({
                filename: filePath,
                extension: ext
              });

              evidenceSheet.addImage(imgId, {
                tl: { col: 1, row: currentRowNum - 1 },
                ext: { width: 240, height: 260 },
                editAs: 'oneCell'
              });
            } catch (imgErr) {
              console.error('Failed to add image to Excel:', imgErr);
              imgCell.value = '이미지 첨부 실패';
            }

            currentRowNum++;
          }
        }
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=ledger-${yearMonth}-${encodeURIComponent(titleName)}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export ledger excel error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 5. 결산보고서 엑셀 다운로드 (계층 구조 지원)
router.get('/settlement/excel', authenticateToken, async (req, res) => {
  const { group, org, year, half } = req.query;
  const { groupId, role } = req.user;

  let targetGroupId = group ? parseInt(group, 10) : null;
  let targetOrgId = org ? parseInt(org, 10) : null;
  let titleName = '교회전체통합';

  if (role !== 'SYSTEM_ADMIN' && role !== 'AUDITOR') {
    targetGroupId = groupId;
    targetOrgId = null;
  }

  try {
    if (targetGroupId) {
      const gInfo = await query.get('SELECT name FROM groups WHERE group_id = ?', [targetGroupId]);
      if (gInfo) titleName = gInfo.name;
    } else if (targetOrgId) {
      const oInfo = await query.get('SELECT name FROM organizations WHERE organization_id = ?', [targetOrgId]);
      if (oInfo) titleName = oInfo.name + ' 통합';
    }

    const months = half === 'FIRST' ? ['01', '02', '03', '04', '05', '06'] : ['07', '08', '09', '10', '11', '12'];
    const monthPlaceholders = months.map(m => `'${year}-${m}'`).join(',');

    let sql = `
      SELECT c.type, c.parent_category, c.child_category, SUM(v.amount) as total_amount
      FROM vouchers v
      JOIN groups g ON v.group_id = g.group_id
      JOIN account_categories c ON v.category_id = c.category_id
      WHERE v.status = 'APPROVED' AND strftime('%Y-%m', v.transaction_date) IN (${monthPlaceholders})
    `;
    const params = [];
    if (targetGroupId) {
      sql += ' AND v.group_id = ?';
      params.push(targetGroupId);
    } else if (targetOrgId) {
      sql += ' AND g.organization_id = ?';
      params.push(targetOrgId);
    }
    sql += ' GROUP BY c.type, c.parent_category, c.child_category ORDER BY c.type DESC, c.parent_category ASC';
    const items = await query.all(sql, params);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('결산보고서');

    worksheet.columns = [
      { header: '구분', key: 'type', width: 12 },
      { header: '대분류', key: 'parent', width: 18 },
      { header: '중분류', key: 'child', width: 18 },
      { header: '예산액', key: 'budget', width: 15, style: { numFmt: '#,##0' } },
      { header: '실 집행액(수익액)', key: 'actual', width: 18, style: { numFmt: '#,##0' } },
      { header: '잔액', key: 'balance', width: 15, style: { numFmt: '#,##0' } },
      { header: '집행률', key: 'rate', width: 12, style: { alignment: { horizontal: 'right' } } },
      { header: '비고', key: 'note', width: 20 }
    ];

    worksheet.insertRow(1, []);
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${titleName} - ${year}년 ${half === 'FIRST' ? '상반기' : '하반기'} 결산보고서`;
    titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF385723' } };
    worksheet.getRow(1).height = 40;

    const headerRow = worksheet.getRow(3);
    headerRow.values = ['구분', '대분류', '중분류', '예산액', '실 집행액(수익액)', '잔액', '집행률', '비고'];
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF548235' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    let sumBudget = 0;
    let sumActual = 0;

    items.forEach(item => {
      const budget = 5000000.00;
      const actual = item.total_amount;
      const balance = item.type === 'EXPENSE' ? (budget - actual) : actual;
      const rate = item.type === 'EXPENSE' ? ((actual / budget) * 100).toFixed(1) + '%' : '100%';

      sumBudget += budget;
      sumActual += actual;

      const row = worksheet.addRow({
        type: item.type === 'INCOME' ? '수입' : '지출',
        parent: item.parent_category,
        child: item.child_category,
        budget: budget,
        actual: actual,
        balance: balance,
        rate: rate,
        note: ''
      });
      row.getCell('A').alignment = { horizontal: 'center' };
    });

    const sumRow = worksheet.addRow({
      type: '총계',
      parent: '-',
      child: '-',
      budget: sumBudget,
      actual: sumActual,
      balance: sumBudget - sumActual,
      rate: ((sumActual / sumBudget) * 100).toFixed(1) + '%',
      note: ''
    });
    sumRow.getCell('A').alignment = { horizontal: 'center' };
    sumRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'double' }, right: { style: 'thin' } };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=settlement-${year}-${half}-${encodeURIComponent(titleName)}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export settlement excel error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
