require('dotenv').config();
global.WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const { initPlatformDb, query } = require('./core/db');
const { login, signup, authenticateToken, requireRole } = require('./core/auth');
const { loadModules } = require('./core/registry');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

// 1. 공통 인증 API
app.post('/api/auth/login', login);
app.post('/api/auth/signup', signup);

// 2. 가입 승인 API (Platform Core)
app.post('/api/users/:id/approve', authenticateToken, requireRole(['SYSTEM_ADMIN']), async (req, res) => {
  const { id } = req.params; // UUID
  const projectId = req.user.projectId || (await query.get("SELECT project_id FROM platform_projects LIMIT 1"))?.project_id;
  try {
    const targetUser = await query.get('SELECT user_id, display_name FROM platform_profiles WHERE user_id = ?', [id]);
    if (!targetUser) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

    await query.run('UPDATE platform_profiles SET is_active = TRUE WHERE user_id = ?', [id]);

    await query.run(`
      INSERT INTO platform_audit_logs (user_id, service_id, project_id, action, details, ip_address, result)
      VALUES (?, 'platform', ?, 'APPROVE_USER', ?, ?, 'SUCCESS')
    `, [req.user.userId, projectId, `가입 승인: ${targetUser.display_name} (ID: ${id})`, req.ip]);

    res.json({ message: '사용자 가입 승인이 완료되었습니다.' });
  } catch (error) {
    console.error('User approve error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 3. 사용자 관리 API (Platform Core)
app.get('/api/users', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  try {
    const projectId = req.user.projectId || (await query.get("SELECT project_id FROM platform_projects LIMIT 1"))?.project_id;
    const users = await query.all(`
      SELECT u.user_id, u.username, u.display_name as name, u.phone as email, u.is_active, u.created_at,
             m.position, m.department_id as group_id, g.name as group_name, o.name as organization_name,
             r.role_id as role
      FROM platform_profiles u
      LEFT JOIN platform_role_assignments r ON u.user_id = r.user_id AND r.service_id = 'church_think' AND r.project_id = ?
      LEFT JOIN church_user_metadata m ON u.user_id = m.user_id
      LEFT JOIN church_departments g ON m.department_id = g.department_id
      LEFT JOIN church_departments o ON g.parent_id = o.department_id
      ORDER BY u.created_at ASC
    `, [projectId]);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.put('/api/users/:id', authenticateToken, requireRole(['SYSTEM_ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { name, email, role, position, group_id, is_active } = req.body;
  try {
    const projectId = req.user.projectId || (await query.get("SELECT project_id FROM platform_projects LIMIT 1"))?.project_id;
    const user = await query.get('SELECT user_id FROM platform_profiles WHERE user_id = ?', [id]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await query.run(`
      UPDATE platform_profiles 
      SET display_name = ?, phone = ?, is_active = ?
      WHERE user_id = ?
    `, [name || user.display_name, email || user.phone, is_active !== undefined ? (is_active ? TRUE : FALSE) : user.is_active, id]);

    if (role) {
      const targetRole = role === 'SYSTEM_ADMIN' ? 'super_admin' :
                         (role === 'AUDITOR' ? 'service_admin' : 'user');
      await query.run(`
        INSERT INTO platform_role_assignments (user_id, service_id, project_id, role_id)
        VALUES (?, 'church_think', ?, ?)
        ON CONFLICT (user_id, service_id, role_id) DO UPDATE SET role_id = EXCLUDED.role_id
      `, [id, projectId, targetRole]);
    }

    if (position || group_id !== undefined) {
      await query.run(`
        INSERT INTO church_user_metadata (user_id, project_id, department_id, position)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (user_id) DO UPDATE SET department_id = EXCLUDED.department_id, position = EXCLUDED.position
      `, [id, projectId, group_id !== undefined ? group_id : null, position || '기타']);
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.delete('/api/users/:id', authenticateToken, requireRole(['SYSTEM_ADMIN']), async (req, res) => {
  const { id } = req.params;
  if (id === req.user.userId) {
    return res.status(400).json({ message: '자기 자신의 계정은 삭제할 수 없습니다.' });
  }
  try {
    const projectId = req.user.projectId || (await query.get("SELECT project_id FROM platform_projects LIMIT 1"))?.project_id;
    const targetUser = await query.get('SELECT display_name FROM platform_profiles WHERE user_id = ?', [id]);
    if (!targetUser) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    
    // Call Supabase Admin Auth API to delete from auth.users (cascades database-wide)
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      console.error('Supabase Auth user delete failed:', error);
      return res.status(400).json({ message: `Auth service error: ${error.message}` });
    }
    
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, service_id, project_id, action, details, ip_address, result)
      VALUES (?, 'platform', ?, 'DELETE_USER', ?, ?, 'SUCCESS')
    `, [req.user.userId, projectId, `사용자 계정 영구 삭제: ${targetUser.display_name} (ID: ${id})`, req.ip]);
    
    res.json({ message: `사용자 '${targetUser.display_name}' 계정이 정상 삭제되었습니다.` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 4. 시스템 감사 로그 API
app.get('/api/logs', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR'], 'accounting'), async (req, res) => {
  const { startDate, endDate, search, action } = req.query;
  try {
    const projectId = req.user.projectId || (await query.get("SELECT project_id FROM platform_projects LIMIT 1"))?.project_id;
    let sql = `
      SELECT l.*, u.username, u.display_name as user_name, r.role_id as user_role
      FROM platform_audit_logs l
      LEFT JOIN platform_profiles u ON l.user_id = u.user_id
      LEFT JOIN platform_role_assignments r ON u.user_id = r.user_id AND r.service_id = 'church_think' AND r.project_id = ?
      WHERE l.project_id = ?
    `;
    const params = [projectId, projectId];
    
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
      sql += ' AND (u.display_name LIKE ? OR u.username LIKE ? OR l.details LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY l.created_at DESC LIMIT 500';
    const logs = await query.all(sql, params);
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 5. 공통 알림 API
app.get('/api/notifications', authenticateToken, async (req, res) => {
  const { userId, projectId } = req.user;
  try {
    const activeProjectId = projectId || (await query.get("SELECT project_id FROM platform_projects LIMIT 1"))?.project_id;
    const notifications = await query.all(`
      SELECT * FROM platform_notifications 
      WHERE user_id = ? AND project_id = ? AND status != 'ARCHIVED'
      ORDER BY created_at DESC 
      LIMIT 50
    `, [userId, activeProjectId]);
    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.get('/api/notifications/all', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR']), async (req, res) => {
  try {
    const projectId = req.user.projectId || (await query.get("SELECT project_id FROM platform_projects LIMIT 1"))?.project_id;
    const notifications = await query.all(`
      SELECT n.*, u.display_name as user_name, u.username as user_username
      FROM platform_notifications n
      JOIN platform_profiles u ON n.user_id = u.user_id
      WHERE n.project_id = ?
      ORDER BY n.created_at DESC
    `, [projectId]);
    res.json(notifications);
  } catch (error) {
    console.error('Fetch all notifications error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  const { userId, projectId } = req.user;
  try {
    const activeProjectId = projectId || (await query.get("SELECT project_id FROM platform_projects LIMIT 1"))?.project_id;
    const result = await query.run(`
      UPDATE platform_notifications 
      SET is_read = 1, status = 'READ' 
      WHERE user_id = ? AND project_id = ? AND status = 'UNREAD'
    `, [userId, activeProjectId]);
    res.json({ message: 'All notifications marked as read', changes: result.changes });
  } catch (error) {
    console.error('Read all notifications error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId, projectId } = req.user;
  try {
    const activeProjectId = projectId || (await query.get("SELECT project_id FROM platform_projects LIMIT 1"))?.project_id;
    const result = await query.run(`
      UPDATE platform_notifications 
      SET is_read = 1, status = 'READ' 
      WHERE notification_id = ? AND user_id = ? AND project_id = ?
    `, [parseInt(id, 10), userId, activeProjectId]);
    res.json({ message: 'Notification marked as read', changes: result.changes });
  } catch (error) {
    console.error('Read notification error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 6. 공통 대시보드 통계 API (교회 회계 모듈 연동 포함)
app.get('/api/dashboard/stats', authenticateToken, requireRole(['SYSTEM_ADMIN', 'AUDITOR'], 'accounting'), async (req, res) => {
  try {
    const projectId = req.user.projectId || (await query.get("SELECT project_id FROM platform_projects LIMIT 1"))?.project_id;
    const userCounts = await query.get(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as pending_users
      FROM platform_profiles
    `);

    const today = new Date().toISOString().slice(0, 10);
    const voucherCounts = await query.get(`
      SELECT 
        SUM(CASE WHEN status = 'SUBMITTED' AND CAST(created_at AS DATE) = CAST(? AS DATE) THEN 1 ELSE 0 END) as today_submitted,
        SUM(CASE WHEN status = 'APPROVED' AND CAST(updated_at AS DATE) = CAST(? AS DATE) THEN 1 ELSE 0 END) as today_approved
      FROM church_vouchers
      WHERE project_id = ?
    `, [today, today, projectId]);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthFinance = await query.get(`
      SELECT 
        SUM(CASE WHEN v.transaction_type = 'EXPENSE' THEN vi.amount ELSE 0.00 END) as monthly_expense,
        SUM(CASE WHEN v.transaction_type = 'INCOME' THEN vi.amount ELSE 0.00 END) as monthly_income
      FROM church_vouchers v
      JOIN church_voucher_items vi ON v.voucher_id = vi.voucher_id
      WHERE v.status = 'APPROVED' AND to_char(v.transaction_date, 'YYYY-MM') = ? AND v.project_id = ?
    `, [currentMonth, projectId]);

    const deptExpenses = await query.all(`
      SELECT g.name as group_name, SUM(vi.amount) as total_expense
      FROM church_vouchers v
      JOIN church_departments g ON v.department_id = g.department_id
      JOIN church_voucher_items vi ON v.voucher_id = vi.voucher_id
      WHERE v.status = 'APPROVED' AND v.transaction_type = 'EXPENSE' AND to_char(v.transaction_date, 'YYYY-MM') = ? AND v.project_id = ?
      GROUP BY g.name
      ORDER BY total_expense DESC
    `, [currentMonth, projectId]);

    const topCategory = await query.get(`
      SELECT c.parent_category || ' > ' || c.child_category as category_name, COUNT(*) as count
      FROM church_vouchers v
      JOIN church_voucher_items vi ON v.voucher_id = vi.voucher_id
      JOIN church_account_categories c ON vi.category_id = c.category_id
      WHERE v.project_id = ?
      GROUP BY c.parent_category, c.child_category
      ORDER BY count DESC
      LIMIT 1
    `, [projectId]);

    let recentLogs = [];
    if (req.user.roles['accounting'] === 'AUDITOR' || req.user.roles['platform'] === 'SYSTEM_ADMIN') {
      recentLogs = await query.all(`
        SELECT l.*, u.display_name as user_name 
        FROM platform_audit_logs l
        LEFT JOIN platform_profiles u ON l.user_id = u.user_id
        WHERE l.project_id = ?
        ORDER BY l.created_at DESC
        LIMIT 5
      `, [projectId]);
    }

    const recentNotis = await query.all(`
      SELECT n.*, u.display_name as user_name
      FROM platform_notifications n
      JOIN platform_profiles u ON n.user_id = u.user_id
      WHERE n.project_id = ?
      ORDER BY n.created_at DESC
      LIMIT 5
    `, [projectId]);

    res.json({
      totalUsers: parseInt(userCounts?.total_users || 0, 10),
      pendingUsers: parseInt(userCounts?.pending_users || 0, 10),
      todaySubmitted: parseInt(voucherCounts?.today_submitted || 0, 10),
      todayApproved: parseInt(voucherCounts?.today_approved || 0, 10),
      monthlyExpense: parseFloat(monthFinance?.monthly_expense || 0),
      monthlyIncome: parseFloat(monthFinance?.monthly_income || 0),
      deptExpenses: deptExpenses.map(d => ({ group_name: d.group_name, total_expense: parseFloat(d.total_expense) })),
      topCategory: topCategory ? topCategory.category_name : '-',
      recentLogs,
      recentNotis
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 7. 정적 서빙 및 라우트 스왑
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// 8. 플랫폼 및 모듈 초기화 부트스트랩
const { startQueueWorker } = require('./core/ai');

async function startServer() {
  try {
    // 1. Initialize Platform Core database
    await initPlatformDb();
    
    // 2. Load all service modules dynamically
    await loadModules(app);
    
    // 3. Start AI queue processing
    await startQueueWorker();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Platform Server] Running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Platform Server] Failed to initialize:', err);
  }
}

startServer();
