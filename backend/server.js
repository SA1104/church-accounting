const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb, query } = require('./db');
const { login, authenticateToken, requireRole } = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

// 1. 로그인
app.post('/api/auth/login', login);

// 1.5 회원가입 신청 (대기 계정으로 생성: is_active = 0)
app.post('/api/auth/signup', async (req, res) => {
  const { username, password, name, role, position, group_id, signature } = req.body;
  if (!username || !password || !name || !role || !position) {
    return res.status(400).json({ message: '필수 정보(아이디, 비밀번호, 이름, 직책 등)가 누락되었습니다.' });
  }
  try {
    const existing = await query.get('SELECT user_id FROM users WHERE username = ?', [username]);
    if (existing) return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await query.run(`
      INSERT INTO users (username, password_hash, name, role, position, group_id, signature, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [username, hash, name, role, position, group_id ? parseInt(group_id, 10) : null, signature || null]);

    res.status(201).json({ message: '회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 1.6 회원가입 신청 승인 (is_active = 1)
app.post('/api/users/:id/approve', authenticateToken, requireRole(['SYSTEM_ADMIN']), async (req, res) => {
  const { id } = req.params;
  try {
    const targetUser = await query.get('SELECT user_id, name FROM users WHERE user_id = ?', [id]);
    if (!targetUser) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

    await query.run('UPDATE users SET is_active = 1 WHERE user_id = ?', [id]);

    await query.run(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_position, target_id, result)
      VALUES (?, 'APPROVE_USER', ?, ?, ?, ?, 'SUCCESS')
    `, [req.user.userId, `가입 승인: ${targetUser.name} (ID: ${id})`, req.ip, req.user.position, id]);

    res.json({ message: '사용자 가입 승인이 완료되었습니다.' });
  } catch (error) {
    console.error('User approve error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 2. 라우터 모듈 매핑
const categoriesRouter = require('./categories');
const vouchersRouter = require('./vouchers');
const approvalsRouter = require('./approvals');
const ledgersRouter = require('./ledgers');
const { router: notificationsRouter } = require('./notifications');
const locksRouter = require('./locks');
const systemRouter = require('./system');

app.use('/api/categories', categoriesRouter);
app.use('/api/vouchers', vouchersRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/ledgers', ledgersRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/period-locks', locksRouter);
app.use('/api/system', systemRouter);

// 3. 위원회/기관(Organizations) API
app.get('/api/organizations', async (req, res) => {
  try {
    const orgs = await query.all('SELECT * FROM organizations WHERE is_active = 1');
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ message: 'Database error' });
  }
});

app.post('/api/organizations', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Organization name is required' });
  try {
    const existing = await query.get('SELECT organization_id FROM organizations WHERE name = ?', [name]);
    if (existing) return res.status(400).json({ message: 'Organization already exists' });

    const result = await query.run('INSERT INTO organizations (name, description) VALUES (?, ?)', [name, description]);
    res.status(201).json({ id: result.id, message: 'Organization created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Database error' });
  }
});

// 4. 소속 그룹(Groups) API
app.get('/api/groups', async (req, res) => {
  const { orgId } = req.query;
  try {
    let sql = 'SELECT g.*, o.name as organization_name FROM groups g JOIN organizations o ON g.organization_id = o.organization_id WHERE g.is_active = 1';
    const params = [];
    if (orgId) {
      sql += ' AND g.organization_id = ?';
      params.push(parseInt(orgId, 10));
    }
    const groups = await query.all(sql, params);
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Database error' });
  }
});

app.post('/api/groups', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { organization_id, name, description } = req.body;
  if (!organization_id || !name) return res.status(400).json({ message: 'Organization ID and group name are required' });
  try {
    const existing = await query.get('SELECT group_id FROM groups WHERE organization_id = ? AND name = ?', [organization_id, name]);
    if (existing) return res.status(400).json({ message: 'Group name already exists in this organization' });

    const result = await query.run('INSERT INTO groups (organization_id, name, description) VALUES (?, ?, ?)', [organization_id, name, description]);

    // Seed default positions for the new group
    const DEFAULT_POSITIONS = [
      { name: '회계', role: 'DEPARTMENT_ACCOUNTANT' },
      { name: '부장', role: 'DEPARTMENT_HEAD' },
      { name: '위원장', role: 'FINANCE_MANAGER' },
      { name: '총무', role: 'DEPARTMENT_ACCOUNTANT' },
      { name: '교역자', role: 'AUDITOR' },
      { name: '기타', role: 'DEPARTMENT_ACCOUNTANT' }
    ];
    for (const pos of DEFAULT_POSITIONS) {
      await query.run('INSERT OR IGNORE INTO group_positions (group_id, name, role) VALUES (?, ?, ?)', [result.id, pos.name, pos.role]);
    }

    res.status(201).json({ id: result.id, message: 'Group created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Database error' });
  }
});

// 4.5. 사용자 계정 삭제 API (어드민 전용)
app.delete('/api/users/:id', authenticateToken, requireRole(['SYSTEM_ADMIN']), async (req, res) => {
  const { id } = req.params;
  if (parseInt(id, 10) === req.user.userId) {
    return res.status(400).json({ message: '자기 자신의 계정은 삭제할 수 없습니다.' });
  }
  try {
    const targetUser = await query.get('SELECT name FROM users WHERE user_id = ?', [id]);
    if (!targetUser) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    
    await query.run('DELETE FROM users WHERE user_id = ?', [id]);
    
    // 감사 로그 기록
    await query.run(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_position, target_id, result)
      VALUES (?, 'DELETE_USER', ?, ?, ?, ?, 'SUCCESS')
    `, [req.user.userId, `사용자 계정 영구 삭제: ${targetUser.name} (ID: ${id})`, req.ip, req.user.position, id]);
    
    res.json({ message: `사용자 '${targetUser.name}' 계정이 정상 삭제되었습니다.` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 4.5.2. 위원회/기관 삭제 API (어드민/재정부장 전용)
app.delete('/api/organizations/:id', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { id } = req.params;
  try {
    const targetOrg = await query.get('SELECT name FROM organizations WHERE organization_id = ?', [id]);
    if (!targetOrg) return res.status(404).json({ message: '위원회를 찾을 수 없습니다.' });

    // Soft delete organization and its sub-groups
    await query.run('UPDATE organizations SET is_active = 0 WHERE organization_id = ?', [id]);
    await query.run('UPDATE groups SET is_active = 0 WHERE organization_id = ?', [id]);

    // 감사 로그 기록
    await query.run(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_position, target_id, result)
      VALUES (?, 'DELETE_ORGANIZATION', ?, ?, ?, ?, 'SUCCESS')
    `, [req.user.userId, `위원회 삭제: ${targetOrg.name} (ID: ${id})`, req.ip, req.user.position, id]);

    res.json({ message: `위원회 '${targetOrg.name}' 및 산하 그룹이 성공적으로 삭제되었습니다.` });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 4.5.3. 소속 그룹 삭제 API (어드민/재정부장 전용)
app.delete('/api/groups/:id', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { id } = req.params;
  try {
    const targetGroup = await query.get('SELECT name FROM groups WHERE group_id = ?', [id]);
    if (!targetGroup) return res.status(404).json({ message: '소속 그룹을 찾을 수 없습니다.' });

    // Soft delete group
    await query.run('UPDATE groups SET is_active = 0 WHERE group_id = ?', [id]);

    // 감사 로그 기록
    await query.run(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_position, target_id, result)
      VALUES (?, 'DELETE_GROUP', ?, ?, ?, ?, 'SUCCESS')
    `, [req.user.userId, `소속 그룹 삭제: ${targetGroup.name} (ID: ${id})`, req.ip, req.user.position, id]);

    res.json({ message: `소속 그룹 '${targetGroup.name}'이(가) 성공적으로 삭제되었습니다.` });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 4.6. 그룹별 직책 조회 API (공개)
app.get('/api/public/groups/:groupId/positions', async (req, res) => {
  const { groupId } = req.params;
  try {
    const positions = await query.all('SELECT * FROM group_positions WHERE group_id = ? ORDER BY position_id ASC', [groupId]);
    res.json(positions);
  } catch (error) {
    console.error('Fetch group positions error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 4.7. 그룹별 직책 등록 API (어드민/재정부장)
app.post('/api/groups/:groupId/positions', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { groupId } = req.params;
  const { name, role } = req.body;
  if (!name || !role) {
    return res.status(400).json({ message: '직책 명칭과 권한 역할은 필수입니다.' });
  }
  try {
    const result = await query.run('INSERT INTO group_positions (group_id, name, role) VALUES (?, ?, ?)', [groupId, name, role]);
    res.status(201).json({ id: result.id, message: '직책이 등록되었습니다.' });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ message: '이미 해당 소속 그룹에 등록된 직책명입니다.' });
    }
    res.status(500).json({ message: 'Database error' });
  }
});

// 4.8. 직책 삭제 API (어드민/재정부장)
app.delete('/api/positions/:positionId', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { positionId } = req.params;
  try {
    await query.run('DELETE FROM group_positions WHERE position_id = ?', [positionId]);
    res.json({ message: '직책이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: 'Database error' });
  }
});

// 5. 결재자 후보군 리스트 조회 API (전결라인용)
app.get('/api/users/approvers', authenticateToken, async (req, res) => {
  try {
    // 1차 결재자 후보: DEPARTMENT_HEAD 역할군 전체
    const deptHeads = await query.all(`
      SELECT user_id, name, position, role FROM users 
      WHERE role = 'DEPARTMENT_HEAD' AND is_active = 1
    `);
    
    // 최종 결재자 후보: FINANCE_MANAGER / SYSTEM_ADMIN 역할군 전체
    const financeTeams = await query.all(`
      SELECT user_id, name, position, role FROM users 
      WHERE (role = 'FINANCE_MANAGER' OR role = 'SYSTEM_ADMIN') AND is_active = 1
    `);

    res.json({ deptHeads, financeTeams });
  } catch (error) {
    res.status(500).json({ message: 'Database error' });
  }
});

// 6. 사용자(Users) API
app.get('/api/users', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  try {
    const users = await query.all(`
      SELECT u.user_id, u.username, u.name, u.email, u.role, u.position, u.group_id, u.is_active, 
             g.name as group_name, o.name as organization_name
      FROM users u
      LEFT JOIN groups g ON u.group_id = g.group_id
      LEFT JOIN organizations o ON g.organization_id = o.organization_id
      ORDER BY u.user_id ASC
    `);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Database error' });
  }
});

app.post('/api/users', authenticateToken, requireRole(['SYSTEM_ADMIN']), async (req, res) => {
  const { username, password, name, email, role, position, group_id } = req.body;
  if (!username || !password || !name || !role || !position) {
    return res.status(400).json({ message: 'Missing required user fields' });
  }
  try {
    const existing = await query.get('SELECT user_id FROM users WHERE username = ?', [username]);
    if (existing) return res.status(400).json({ message: 'Username is already taken' });

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await query.run(`
      INSERT INTO users (username, password_hash, name, email, role, position, group_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [username, hash, name, email, role, position, group_id || null]);

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.put('/api/users/:id', authenticateToken, requireRole(['SYSTEM_ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { name, email, role, position, group_id, is_active } = req.body;
  try {
    const user = await query.get('SELECT user_id FROM users WHERE user_id = ?', [id]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await query.run(`
      UPDATE users 
      SET name = ?, email = ?, role = ?, position = ?, group_id = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `, [name || user.name, email || user.email, role || user.role, position || user.position, group_id !== undefined ? group_id : user.group_id, is_active !== undefined ? is_active : user.is_active, id]);

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Database error' });
  }
});

// 7. 로그
app.get('/api/logs', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  const { startDate, endDate, search, action } = req.query;
  try {
    let sql = `
      SELECT l.*, u.username, u.name as user_name, u.role as user_role
      FROM system_logs l
      LEFT JOIN users u ON l.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    
    if (startDate) {
      sql += ' AND l.created_at >= ?';
      params.push(startDate + ' 00:00:00');
    }
    if (endDate) {
      sql += ' AND l.created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }
    if (action) {
      sql += ' AND l.action = ?';
      params.push(action);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR u.username LIKE ? OR l.details LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY l.created_at DESC LIMIT 500';
    const logs = await query.all(sql, params);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Database error' });
  }
});

// 8. 관리자용 대시보드 운영 통계 API
app.get('/api/dashboard/stats', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  try {
    const userCounts = await query.get(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as pending_users
      FROM users
    `);

    const today = new Date().toISOString().slice(0, 10);
    const voucherCounts = await query.get(`
      SELECT 
        SUM(CASE WHEN status = 'SUBMITTED' AND date(created_at) = date(?) THEN 1 ELSE 0 END) as today_submitted,
        SUM(CASE WHEN status = 'APPROVED' AND date(updated_at) = date(?) THEN 1 ELSE 0 END) as today_approved
      FROM vouchers
    `, [today, today]);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthFinance = await query.get(`
      SELECT 
        SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0.00 END) as monthly_expense,
        SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0.00 END) as monthly_income
      FROM vouchers
      WHERE status = 'APPROVED' AND strftime('%Y-%m', transaction_date) = ?
    `, [currentMonth]);

    const deptExpenses = await query.all(`
      SELECT g.name as group_name, SUM(v.amount) as total_expense
      FROM vouchers v
      JOIN groups g ON v.group_id = g.group_id
      WHERE v.status = 'APPROVED' AND v.transaction_type = 'EXPENSE' AND strftime('%Y-%m', v.transaction_date) = ?
      GROUP BY g.group_id
      ORDER BY total_expense DESC
    `, [currentMonth]);

    const topCategory = await query.get(`
      SELECT c.parent_category || ' > ' || c.child_category as category_name, COUNT(*) as count
      FROM vouchers v
      JOIN account_categories c ON v.category_id = c.category_id
      GROUP BY v.category_id
      ORDER BY count DESC
      LIMIT 1
    `);

    let recentLogs = [];
    if (req.user.role === 'AUDITOR') {
      recentLogs = await query.all(`
        SELECT l.*, u.name as user_name 
        FROM system_logs l
        LEFT JOIN users u ON l.user_id = u.user_id
        ORDER BY l.created_at DESC
        LIMIT 5
      `);
    }

    const recentNotis = await query.all(`
      SELECT n.*, u.name as user_name
      FROM notifications n
      JOIN users u ON n.user_id = u.user_id
      ORDER BY n.created_at DESC
      LIMIT 5
    `);

    res.json({
      totalUsers: userCounts.total_users || 0,
      pendingUsers: userCounts.pending_users || 0,
      todaySubmitted: voucherCounts.today_submitted || 0,
      todayApproved: voucherCounts.today_approved || 0,
      monthlyExpense: monthFinance.monthly_expense || 0,
      monthlyIncome: monthFinance.monthly_income || 0,
      deptExpenses,
      topCategory: topCategory ? topCategory.category_name : '-',
      recentLogs,
      recentNotis
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

const { startQueueWorker } = require('./ocr_queue');

async function startServer() {
  try {
    await initDb();
    await startQueueWorker();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database/server:', err);
  }
}

startServer();
