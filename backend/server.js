require('dotenv').config();
global.WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'placeholder-anon-key';

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  'placeholder-service-role-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Warn if Supabase keys are not properly set
if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.includes('your-service-role-key') || SUPABASE_SERVICE_ROLE_KEY.includes('dummy')) {
  console.warn('[Supabase] Service Role Key is missing or placeholder. Auth operations may fail.');
}
if (!SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Anon/Public key is missing. Public auth operations may fail.');
}

const { initPlatformDb, query } = require('./core/db');
const { login, signup, authenticateToken, requireRole, changePassword } = require('./core/auth');
const {
  getRegisterOptions,
  verifyRegister,
  getLoginOptions,
  verifyLogin,
  listCredentials,
  deleteCredential
} = require('./core/auth/passkey');
const { loadModules } = require('./core/registry');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
// Duplicate health route removed; robust implementation retained later in file

// Legacy URL compatibility rewriter middleware (Forwarding to service/church)
app.use((req, res, next) => {
  if (req.url.startsWith('/api/organizations')) {
    req.url = req.url.replace('/api/organizations', '/api/services/church/organizations');
    console.log(`[Platform Router] Rewrote: /api/organizations -> /api/services/church/organizations`);
  } else if (req.url.startsWith('/api/groups')) {
    req.url = req.url.replace('/api/groups', '/api/services/church/groups');
    console.log(`[Platform Router] Rewrote: /api/groups -> /api/services/church/groups`);
  } else if (req.url.startsWith('/api/church/context-scope')) {
    req.url = req.url.replace('/api/church/context-scope', '/api/services/church/context-scope');
    console.log(`[Platform Router] Rewrote: /api/church/context-scope -> /api/services/church/context-scope`);
  } else if (req.url.startsWith('/api/vouchers')) {
    req.url = req.url.replace('/api/vouchers', '/api/services/church/vouchers');
    console.log(`[Platform Router] Rewrote: /api/vouchers -> /api/services/church/vouchers`);
  } else if (req.url.startsWith('/api/ledgers')) {
    req.url = req.url.replace('/api/ledgers', '/api/services/church/ledgers');
    console.log(`[Platform Router] Rewrote: /api/ledgers -> /api/services/church/ledgers`);
  } else if (req.url.startsWith('/api/approvals')) {
    req.url = req.url.replace('/api/approvals', '/api/services/church/approvals');
    console.log(`[Platform Router] Rewrote: /api/approvals -> /api/services/church/approvals`);
  } else if (req.url.startsWith('/api/period-locks')) {
    req.url = req.url.replace('/api/period-locks', '/api/services/church/period-locks');
    console.log(`[Platform Router] Rewrote: /api/period-locks -> /api/services/church/period-locks`);
  } else if (req.url.startsWith('/api/categories')) {
    req.url = req.url.replace('/api/categories', '/api/services/church/categories');
    console.log(`[Platform Router] Rewrote: /api/categories -> /api/services/church/categories`);
  }
  next();
});

const uploadDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

// 1. 공통 인증 API
app.post('/api/auth/login', login);
app.post('/api/auth/signup', signup);
app.post('/api/auth/change-password', authenticateToken, changePassword);

// Passkey/WebAuthn API
app.post('/api/auth/passkey/register/options', authenticateToken, getRegisterOptions);
app.post('/api/auth/passkey/register/verify', authenticateToken, verifyRegister);
app.post('/api/auth/passkey/login/options', getLoginOptions);
app.post('/api/auth/passkey/login/verify', verifyLogin);
app.get('/api/auth/passkey/credentials', authenticateToken, listCredentials);
app.delete('/api/auth/passkey/credentials/:id', authenticateToken, deleteCredential);

// 1-1. 다교회 온보딩 공통 조회 API (미인증)
app.get('/api/churches', async (req, res) => {
  try {
    const showAll = req.query.all === 'true';
    const search = req.query.search;
    let sql = "SELECT church_id, project_id, church_name, denomination, region, address, phone, email, homepage_url, logo_url, primary_color, secondary_color, status FROM public.church_profiles";
    const params = [];
    const whereClauses = [];
    if (!showAll) {
      whereClauses.push("status = 'active'");
    }
    if (search) {
      whereClauses.push("(church_name LIKE ? OR denomination LIKE ? OR region LIKE ? OR address LIKE ?)");
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    if (whereClauses.length > 0) {
      sql += " WHERE " + whereClauses.join(" AND ");
    }
    const list = await query.all(sql, params);
    res.json(list);
  } catch (error) {
    console.error('Error fetching churches:', error);
    res.status(500).json({ message: 'Database error fetching churches' });
  }
});

app.get('/api/churches/:id/departments', async (req, res) => {
  const { id } = req.params; // church_id (UUID)
  try {
    const list = await query.all(
      "SELECT department_id, parent_id, name, description, is_active FROM public.church_departments WHERE church_profile_id = ? AND parent_id IS NULL AND is_active = TRUE ORDER BY name ASC",
      [id]
    );
    res.json(list);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Database error fetching departments' });
  }
});

app.get('/api/departments/:id/groups', async (req, res) => {
  const { id } = req.params; // department_id (INTEGER)
  try {
    const list = await query.all(
      "SELECT id as group_id, church_profile_id, department_id, name, description, sort_order, is_active FROM public.church_groups WHERE department_id = ? AND is_active = TRUE ORDER BY sort_order ASC, name ASC",
      [parseInt(id, 10)]
    );
    res.json(list);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Database error fetching groups' });
  }
});

// 1-2. 관리자용 조직 관리 API (인증 필수)
const requireAdminRole = requireRole(['SYSTEM_ADMIN', 'AUDITOR'], 'accounting');

app.get('/api/admin/departments', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const church = await query.get("SELECT church_id FROM public.church_profiles WHERE project_id = ? LIMIT 1", [req.user.projectId]);
    if (!church) return res.status(404).json({ message: '교회 프로필을 찾을 수 없습니다.' });

    const list = await query.all(
      "SELECT department_id, parent_id, name, description, is_active FROM public.church_departments WHERE church_profile_id = ? AND parent_id IS NULL ORDER BY name ASC",
      [church.church_id]
    );
    res.json(list);
  } catch (error) {
    console.error('Error fetching admin departments:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.post('/api/admin/departments', authenticateToken, requireAdminRole, async (req, res) => {
  console.log('[ORG CREATE] auth user:', {
    id: req.user?.id,
    email: req.user?.email,
    role: req.user?.role,
    isAdmin: req.user?.isAdmin,
    projectId: req.user?.projectId,
    accounting: req.user?.accounting
  });
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: '부서명이 누락되었습니다.' });

  try {
    const church = await query.get("SELECT church_id FROM public.church_profiles WHERE project_id = ? LIMIT 1", [req.user.projectId]);
    if (!church) return res.status(404).json({ message: '교회 프로필을 찾을 수 없습니다.' });

    const result = await query.run(
      "INSERT INTO public.church_departments (project_id, parent_id, name, description, church_profile_id, is_active) VALUES (?, NULL, ?, ?, ?, TRUE) RETURNING department_id",
      [req.user.projectId, name, description || '', church.church_id]
    );
    res.status(201).json({ id: result.id, message: '부서가 생성되었습니다.' });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.put('/api/admin/departments/:id', authenticateToken, requireAdminRole, async (req, res) => {
  const { id } = req.params;
  const { name, description, is_active } = req.body;
  try {
    await query.run(
      "UPDATE public.church_departments SET name = COALESCE(?, name), description = COALESCE(?, description), is_active = COALESCE(?, is_active) WHERE department_id = ? AND project_id = ?",
      [name, description, is_active, parseInt(id, 10), req.user.projectId]
    );
    res.json({ message: '부서 정보가 수정되었습니다.' });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.delete('/api/admin/departments/:id', authenticateToken, requireAdminRole, async (req, res) => {
  const { id } = req.params;
  try {
    await query.run(
      "UPDATE public.church_departments SET is_active = FALSE WHERE department_id = ? AND project_id = ?",
      [parseInt(id, 10), req.user.projectId]
    );
    res.json({ message: '부서가 비활성화되었습니다.' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.get('/api/admin/departments/:id/groups', authenticateToken, requireAdminRole, async (req, res) => {
  const { id } = req.params;
  try {
    const list = await query.all(
      "SELECT id as group_id, church_profile_id, department_id, name, description, sort_order, is_active FROM public.church_groups WHERE department_id = ? ORDER BY sort_order ASC, name ASC",
      [parseInt(id, 10)]
    );
    res.json(list);
  } catch (error) {
    console.error('Error fetching admin groups:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.post('/api/admin/groups', authenticateToken, requireAdminRole, async (req, res) => {
  console.log('[ORG CREATE] auth user:', {
    id: req.user?.id,
    email: req.user?.email,
    role: req.user?.role,
    isAdmin: req.user?.isAdmin,
    projectId: req.user?.projectId,
    accounting: req.user?.accounting
  });
  const { department_id, name, description, sort_order } = req.body;
  if (!department_id || !name) return res.status(400).json({ message: '부서 ID와 그룹명이 누락되었습니다.' });

  try {
    const church = await query.get("SELECT church_id FROM public.church_profiles WHERE project_id = ? LIMIT 1", [req.user.projectId]);
    if (!church) return res.status(404).json({ message: '교회 프로필을 찾을 수 없습니다.' });

    const result = await query.run(
      "INSERT INTO public.church_groups (church_profile_id, department_id, name, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, TRUE) RETURNING id",
      [church.church_id, parseInt(department_id, 10), name, description || '', sort_order || 0]
    );
    res.status(201).json({ id: result.id, message: '소속 그룹이 생성되었습니다.' });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.put('/api/admin/groups/:id', authenticateToken, requireAdminRole, async (req, res) => {
  const { id } = req.params; // UUID
  const { name, description, sort_order, is_active } = req.body;
  try {
    await query.run(
      "UPDATE public.church_groups SET name = COALESCE(?, name), description = COALESCE(?, description), sort_order = COALESCE(?, sort_order), is_active = COALESCE(?, is_active) WHERE id = ?",
      [name, description, sort_order, is_active, id]
    );
    res.json({ message: '소속 그룹 정보가 수정되었습니다.' });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.delete('/api/admin/groups/:id', authenticateToken, requireAdminRole, async (req, res) => {
  const { id } = req.params; // UUID
  try {
    await query.run("UPDATE public.church_groups SET is_active = FALSE WHERE id = ?", [id]);
    res.json({ message: '소속 그룹이 비활성화되었습니다.' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// Decision Engine & Media Engine Mounts
const decisionRouter = require('./core/decision/index.js');
const mediaRouter = require('./core/media/index.js');
app.use('/api/core/decision', decisionRouter);
app.use('/api/core/media', mediaRouter);

// New Core Engine Mounts (Phase 6)
app.use('/api/core/data', require('./core/data/index.js'));
app.use('/api/core/cleaning', require('./core/cleaning/index.js'));
app.use('/api/core/standardization', require('./core/standardization/index.js'));
app.use('/api/core/intelligence', require('./core/intelligence/index.js'));
app.use('/api/core/simulation', require('./core/simulation/index.js'));
app.use('/api/core/prediction', require('./core/prediction/index.js'));
app.use('/api/core/learning', require('./core/learning/index.js'));
app.use('/api/core/distribution', require('./core/distribution/index.js'));
app.use('/api/core/workflow', require('./core/workflow/index.js'));

// 2. 가입 승인 API (Platform Core)
app.post('/api/users/:id/approve', authenticateToken, requireRole(['SYSTEM_ADMIN']), async (req, res) => {
  const { id } = req.params; // UUID
  const projectId = req.user.projectId || (await query.get("SELECT project_id FROM platform_projects LIMIT 1"))?.project_id;
  try {
    const targetUser = await query.get('SELECT user_id, display_name, signup_status FROM platform_profiles WHERE user_id = ?', [id]);
    if (!targetUser) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

    if (targetUser.signup_status === 'pending_church_approval') {
      // Find the associated project_id from platform_project_members
      const membership = await query.get('SELECT project_id FROM platform_project_members WHERE user_id = ? LIMIT 1', [id]);
      if (membership && membership.project_id) {
        // Activate church profile
        await query.run("UPDATE church_profiles SET status = 'active', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE project_id = ?", [req.user.userId, membership.project_id]);
        // Activate platform project
        await query.run("UPDATE platform_projects SET status = 'ACTIVE', is_active = TRUE WHERE project_id = ?", [membership.project_id]);
      }
    }

    // Set user as active and approved
    await query.run("UPDATE platform_profiles SET is_active = TRUE, signup_status = 'approved' WHERE user_id = ?", [id]);

    // Handle custom department/group approval if present
    const meta = await query.get('SELECT project_id, custom_department_name, custom_group_name FROM church_user_metadata WHERE user_id = ?', [id]);
    if (meta) {
      let deptId = null;
      if (meta.custom_department_name) {
        // Check if department exists
        const existingDept = await query.get('SELECT department_id FROM church_departments WHERE project_id = ? AND name = ? LIMIT 1', [meta.project_id, meta.custom_department_name]);
        if (existingDept) {
          deptId = existingDept.department_id;
        } else {
          const insertResult = await query.run('INSERT INTO church_departments (project_id, name, description, is_active) VALUES (?, ?, ?, TRUE)', [meta.project_id, meta.custom_department_name, '사용자 가입 신청 시 직접 입력으로 생성된 부서']);
          deptId = insertResult.id;
        }
        await query.run('UPDATE church_user_metadata SET department_id = ? WHERE user_id = ?', [deptId, id]);
      }

      if (meta.custom_group_name) {
        const finalDeptId = deptId || (await query.get('SELECT department_id FROM church_user_metadata WHERE user_id = ?', [id]))?.department_id;
        if (finalDeptId) {
          const existingGroup = await query.get('SELECT id FROM church_groups WHERE department_id = ? AND name = ? LIMIT 1', [finalDeptId, meta.custom_group_name]);
          let groupUuid = null;
          if (existingGroup) {
            groupUuid = existingGroup.id;
          } else {
            groupUuid = require('crypto').randomUUID();
            await query.run('INSERT INTO church_groups (id, church_profile_id, department_id, name, description, is_active) VALUES (?, (SELECT church_id FROM church_profiles WHERE project_id = ? LIMIT 1), ?, ?, ?, TRUE)', [groupUuid, meta.project_id, finalDeptId, meta.custom_group_name, '사용자 가입 신청 시 직접 입력으로 생성된 그룹']);
          }
          await query.run('UPDATE church_user_metadata SET group_uuid = ? WHERE user_id = ?', [groupUuid, id]);
        }
      }
    }

    await query.run(`
      INSERT INTO platform_audit_logs (user_id, service_id, project_id, action, details, ip_address, result)
      VALUES (?, 'platform', ?, 'APPROVE_USER', ?, ?, 'SUCCESS')
    `, [req.user.userId, projectId, `가입 승인: ${targetUser.display_name} (ID: ${id})`, req.ip]);

    res.json({ message: '사용자 및 교회 승인이 완료되었습니다.' });
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
             m.custom_department_name, m.custom_group_name,
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

app.get('/api/diagnose-db-v2', async (req, res) => {
  try {
    const tables = await query.all(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const groupCols = await query.all(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'church_groups'
    `);
    const profileCols = await query.all(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'church_profiles'
    `);
    res.json({ tables, groupCols, profileCols });
  } catch (err) {
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// Platform Onboarding & Branding APIs (TEAM G & TEAM C)
app.get('/api/church/profile', authenticateToken, async (req, res) => {
  try {
    const projectId = req.user.projectId || (await query.get("SELECT project_id FROM platform_projects LIMIT 1"))?.project_id;
    const profile = await query.get('SELECT * FROM church_profiles WHERE project_id = ? LIMIT 1', [projectId]);
    if (profile) {
      return res.json(profile);
    }
    // Fallback to default branding info (Shin-gil Church)
    return res.json({
      church_name: '신길교회',
      denomination: '기독교대한성결교회',
      region: '서울시 영등포구',
      manager_name: '관리자',
      primary_color: '#38669b',
      secondary_color: '#2b517d',
      logo_url: '/church_logo.png'
    });
  } catch (err) {
    console.error('Error fetching church profile:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// Billing & Usage Stub APIs (Commercial Architecture)
app.get('/api/billing/subscription', authenticateToken, async (req, res) => {
  try {
    const projectId = req.user.projectId || (await query.get("SELECT project_id FROM platform_projects LIMIT 1"))?.project_id;
    let sub = await query.get('SELECT * FROM billing_stubs WHERE project_id = ? LIMIT 1', [projectId]);
    if (!sub) {
      await query.run(`
        INSERT INTO billing_stubs (project_id, tier, status, amount)
        VALUES (?, 'Free', 'ACTIVE', 0.00)
      `, [projectId]);
      sub = await query.get('SELECT * FROM billing_stubs WHERE project_id = ? LIMIT 1', [projectId]);
    }
    res.json(sub);
  } catch (err) {
    console.error('Error fetching billing subscription:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

app.get('/api/billing/usage', authenticateToken, async (req, res) => {
  try {
    const projectId = req.user.projectId || (await query.get("SELECT project_id FROM platform_projects LIMIT 1"))?.project_id;
    const usage = await query.all('SELECT * FROM usage_stubs WHERE project_id = ?', [projectId]);
    if (usage.length === 0) {
      const metrics = [
        { name: 'LLM_TOKEN', qty: 25000, unit: 'TOKENS' },
        { name: 'OCR', qty: 42, unit: 'DOCUMENTS' },
        { name: 'STORAGE', qty: 1.84, unit: 'GB' },
        { name: 'IMAGE_GENERATION', qty: 8, unit: 'IMAGES' },
        { name: 'VIDEO_GENERATION', qty: 120, unit: 'SECONDS' },
        { name: 'REPORT_GENERATION', qty: 14, unit: 'REPORTS' },
        { name: 'PPT_GENERATION', qty: 3, unit: 'TEMPLATES' },
        { name: 'API_CALL', qty: 450, unit: 'CALLS' },
        { name: 'WORKFLOW', qty: 95, unit: 'RUNS' }
      ];
      for (const m of metrics) {
        await query.run(`
          INSERT INTO usage_stubs (project_id, metric_name, quantity, unit)
          VALUES (?, ?, ?, ?)
        `, [projectId, m.name, m.qty, m.unit]);
      }
      const freshUsage = await query.all('SELECT * FROM usage_stubs WHERE project_id = ?', [projectId]);
      return res.json(freshUsage);
    }
    res.json(usage);
  } catch (err) {
    console.error('Error fetching usage:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// Governance Engine Registry API (TEAM F & TEAM D)
// GET /api/governance/registry?type=engine
// GET /api/governance/registry?type=plugin
// GET /api/governance/registry?type=dataset
// GET /api/governance/registry?type=product
app.get('/api/governance/registry', authenticateToken, async (req, res) => {
  const { type } = req.query; // 'engine', 'plugin', 'dataset', 'product'
  try {
    let registryType = null;
    if (type) {
      registryType = type.toUpperCase();
    }
    
    let rows;
    if (registryType) {
      rows = await query.all('SELECT * FROM platform_registries WHERE registry_type = ? ORDER BY item_key ASC', [registryType]);
    } else {
      rows = await query.all('SELECT * FROM platform_registries ORDER BY registry_type ASC, item_key ASC');
    }
    
    // Fallback stub metadata if DB is not populated or empty
    if (rows.length === 0) {
      const mockItems = [
        { registry_type: 'ENGINE', item_key: 'DataEngine', item_name: 'DataEngine Component', version: '1.0.0', owner: 'PLATFORM_ADMIN', enabled: true },
        { registry_type: 'ENGINE', item_key: 'DecisionEngine', item_name: 'DecisionEngine Component', version: '1.0.0', owner: 'PLATFORM_ADMIN', enabled: true },
        { registry_type: 'PRODUCT', item_key: 'church_think', item_name: 'Church Think', version: '1.0.0', owner: 'FINANCE_COMM', enabled: true },
        { registry_type: 'PRODUCT', item_key: 'stock_think', item_name: 'Stock Think', version: '1.0.0', owner: 'INVEST_COMM', enabled: false }
      ];
      rows = registryType ? mockItems.filter(item => item.registry_type === registryType) : mockItems;
    }

    res.json(rows);
  } catch (err) {
    console.error('Error fetching governance registry:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// Data Catalog API (TEAM B)
// GET /api/public/data-catalog
app.get('/api/public/data-catalog', async (req, res) => {
  try {
    const catalog = [
      { standard_field: 'region_code', description: '법정동/행정동 코드', type: 'VARCHAR(10)' },
      { standard_field: 'region_name', description: '지역 행정 구역 명칭', type: 'VARCHAR(100)' },
      { standard_field: 'latitude', description: '위도 좌표값', type: 'NUMERIC(10,8)' },
      { standard_field: 'longitude', description: '경도 좌표값', type: 'NUMERIC(11,8)' },
      { standard_field: 'address', description: '상세 도로명/지번 주소', type: 'TEXT' },
      { standard_field: 'trade_price', description: '거래 실거래 가격 (원화 환산)', type: 'NUMERIC(15,2)' },
      { standard_field: 'trade_date', description: '계약 체결 일자 (YYYY-MM-DD)', type: 'DATE' },
      { standard_field: 'amount', description: '금액 또는 재정 집행 비용', type: 'NUMERIC(15,2)' },
      { standard_field: 'currency', description: '통화 코드 (ISO 4217)', type: 'VARCHAR(3)' },
      { standard_field: 'entity_name', description: '개체 기본 명칭 (회사명, 아파트명 등)', type: 'VARCHAR(100)' },
      { standard_field: 'building_year', description: '준공 또는 설립 연도', type: 'INTEGER' },
      { standard_field: 'floor_level', description: '건물 층수', type: 'INTEGER' },
      { standard_field: 'net_area', description: '전용 면적 (제곱미터)', type: 'NUMERIC(10,4)' }
    ];
    res.json({
      status: 'success',
      catalog_version: '1.0.0',
      total_fields: catalog.length,
      data: catalog
    });
  } catch (err) {
    console.error('Error in public data catalog:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Data Source Map API (TEAM D)
// GET /api/public/data-sources
app.get('/api/public/data-sources', async (req, res) => {
  try {
    const dataSources = [
      {
        data_name: '실시간/일별 주가 시세 정보',
        provider: '한국거래소 (KRX) / 증권사 OpenAPI',
        owner: '금융 투자 의사결정 위원회',
        license: '상업용 유료 라이선스',
        cost: '월 500,000 KRW',
        collection_method: 'WebSocket 및 REST API',
        frequency: '장중 실시간 / 배치',
        raw_format: 'JSON / CSV',
        standard_model: 'OHLCV 표준 시계열',
        data_catalog_mapping: ['trade_price', 'trade_date', 'entity_name'],
        ontology_mapping: 'Entity(StockItem)->Attribute(Price)->Event(Trade)',
        quality_score: 98,
        last_update: '2026-06-28 00:00:00',
        review_date: '2026-12-31',
        status: 'ACTIVE',
        description: '국내 상장 주식의 일별 가격 추세 데이터 피드'
      },
      {
        data_name: '국토교통부 아파트/오피스텔 매매 실거래 정보',
        provider: '국토교통부 실거래가 공개시스템 Open API',
        owner: '부동산 가치 평가 위원회',
        license: '공공데이터 무료 라이선스',
        cost: '0 KRW',
        collection_method: 'XML/JSON REST API',
        frequency: '일별 오전 04:00 배치',
        raw_format: 'XML',
        standard_model: '지역법정동/평형별 실거래 계약 표준',
        data_catalog_mapping: ['trade_price', 'trade_date', 'entity_name', 'region_code'],
        ontology_mapping: 'Entity(Apartment)->Attribute(Price)->Event(TradeContract)',
        quality_score: 95,
        last_update: '2026-06-28 04:00:00',
        review_date: '2026-09-30',
        status: 'ACTIVE',
        description: '전국 부동산 실거래 체결 통계 데이터 피드'
      },
      {
        data_name: '각 부서별 회계 지출/수입 전표 명세서',
        provider: 'Church Accounting Frontend Input / PWA OCR Parser',
        owner: '당회 회계 재정 위원회',
        license: '자체 내부 독점 소유 라이선스',
        cost: '0 KRW',
        collection_method: '기안자 실시간 전표 입력 및 OCR 영수증 추출',
        frequency: '실시간',
        raw_format: 'JSON (데이터베이스 레코드)',
        standard_model: '표준 복식부기 전표 구조',
        data_catalog_mapping: ['amount', 'trade_date', 'entity_name'],
        ontology_mapping: 'Organization(Church)->Person(Accountant)->Event(Transaction)',
        quality_score: 99,
        last_update: '2026-06-27T18:22:00Z',
        review_date: '2026-12-31',
        status: 'ACTIVE',
        description: '교회 재정 예산 가용 상태 및 실지출 증빙 영수증'
      }
    ];
    res.json({
      status: 'success',
      total_sources: dataSources.length,
      data: dataSources
    });
  } catch (err) {
    console.error('Error in public data sources:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Data Quality standard API (TEAM C)
// GET /api/public/data-quality
app.get('/api/public/data-quality', async (req, res) => {
  try {
    const qualityMetrics = {
      standard_gating_threshold: 80,
      evaluation_metrics: [
        { metric: 'Completeness', description: '필수 필드 누락 비율 검증 (결측치 제로 목표)' },
        { metric: 'Accuracy', description: '데이터 범위 및 정적 도메인 규격 준수율' },
        { metric: 'Consistency', description: '이종 DB 간 차대변 및 시계열 데이터 교차 검산 정합성' },
        { metric: 'Freshness', description: '수집 주기 대비 지연 한도 준수 수준' },
        { metric: 'Reliability', description: '원천 채널 공인 수준 및 섭취 안정도' },
        { metric: 'License', description: '상업용 유무료 라이선스 적정 가용 상태' },
        { metric: 'Duplicate', description: '레코드 중복 제어 및 정제 등급' },
        { metric: 'Missing Value', description: '비필수 필드들의 결측 임계 비율 충족도' }
      ],
      current_evaluation: [
        { data_name: '주가 시세 정보', score: 98, status: 'PASSED' },
        { data_name: '부동산 실거래가 정보', score: 95, status: 'PASSED' },
        { data_name: '교회 전표 명세서', score: 99, status: 'PASSED' }
      ]
    };
    res.json({
      status: 'success',
      data: qualityMetrics
    });
  } catch (err) {
    console.error('Error in public data quality:', err);
    res.status(500).json({ message: 'Server error' });
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
const { enforceContextSecurity } = require('./service/church/contextScope');

app.get('/api/dashboard/stats', authenticateToken, enforceContextSecurity, async (req, res) => {
  const { group, committee, fiscalYear } = req.query;
  const scope = req.contextScope;
  const activeYear = fiscalYear || '2026';

  try {
    const projectId = req.user.projectId || (await query.get("SELECT project_id FROM platform_projects LIMIT 1"))?.project_id;
    
    // Build where clause for group filtering based on scope permissions
    let groupFilterSql = '';
    const groupParams = [];
    if (!scope.canViewChurchWide) {
      if (group) {
        const groupInt = parseInt(group, 10);
        if (!scope.allowedGroupIds.includes(groupInt)) {
          return res.status(403).json({ error: 'FORBIDDEN_CONTEXT', message: '해당 조직 범위의 데이터를 조회할 권한이 없습니다.' });
        }
        groupFilterSql = ' AND department_id = ?';
        groupParams.push(groupInt);
      } else {
        if (scope.allowedGroupIds.length > 0) {
          groupFilterSql = ` AND department_id IN (${scope.allowedGroupIds.map(() => '?').join(',')})`;
          groupParams.push(...scope.allowedGroupIds);
        } else {
          groupFilterSql = ' AND 1=0';
        }
      }
    } else if (group) {
      groupFilterSql = ' AND department_id = ?';
      groupParams.push(parseInt(group, 10));
    }

    if (committee) {
      const committeeInt = parseInt(committee, 10);
      if (!scope.canViewAllCommittees && !scope.allowedCommitteeIds.includes(committeeInt)) {
        return res.status(403).json({ error: 'FORBIDDEN_CONTEXT', message: '해당 조직 범위의 데이터를 조회할 권한이 없습니다.' });
      }
      groupFilterSql += ' AND department_id IN (SELECT department_id FROM church_departments WHERE parent_id = ?)';
      groupParams.push(committeeInt);
    }

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
      WHERE project_id = ? ${groupFilterSql}
    `, [today, today, projectId, ...groupParams]);

    const startDate = `${activeYear}-01-01`;
    const endDate = `${activeYear}-12-31`;

    const monthFinance = await query.get(`
      SELECT 
        SUM(CASE WHEN v.transaction_type = 'EXPENSE' THEN vi.amount ELSE 0.00 END) as monthly_expense,
        SUM(CASE WHEN v.transaction_type = 'INCOME' THEN vi.amount ELSE 0.00 END) as monthly_income
      FROM church_vouchers v
      JOIN church_voucher_items vi ON v.voucher_id = vi.voucher_id
      WHERE v.status = 'APPROVED' 
        AND v.transaction_date >= ? AND v.transaction_date <= ? 
        AND v.project_id = ? ${groupFilterSql.replace(/department_id/g, 'v.department_id')}
    `, [startDate, endDate, projectId, ...groupParams]);

    const deptExpenses = await query.all(`
      SELECT g.name as group_name, SUM(vi.amount) as total_expense
      FROM church_vouchers v
      JOIN church_departments g ON v.department_id = g.department_id
      JOIN church_voucher_items vi ON v.voucher_id = vi.voucher_id
      WHERE v.status = 'APPROVED' 
        AND v.transaction_type = 'EXPENSE' 
        AND v.transaction_date >= ? AND v.transaction_date <= ? 
        AND v.project_id = ? ${groupFilterSql.replace(/department_id/g, 'v.department_id')}
      GROUP BY g.name
      ORDER BY total_expense DESC
    `, [startDate, endDate, projectId, ...groupParams]);

    const topCategory = await query.get(`
      SELECT c.parent_category || ' > ' || c.child_category as category_name, COUNT(*) as count
      FROM church_vouchers v
      JOIN church_voucher_items vi ON v.voucher_id = vi.voucher_id
      JOIN church_account_categories c ON vi.category_id = c.category_id
      WHERE v.project_id = ? ${groupFilterSql.replace(/department_id/g, 'v.department_id')}
      GROUP BY c.parent_category, c.child_category
      ORDER BY count DESC
      LIMIT 1
    `, [projectId, ...groupParams]);

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
    res.status(500).json({ message: 'Database error', details: error.message });
  }
});

// 7. 정적 서빙 및 라우트 스왑
const frontendDist = path.join(__dirname, '../frontend/dist');

console.log('[Static] __dirname:', __dirname);
console.log('[Static] frontendDist:', frontendDist);
console.log('[Static] index.html exists:', fs.existsSync(path.join(frontendDist, 'index.html')));
console.log('[Static] assets exists:', fs.existsSync(path.join(frontendDist, 'assets')));

app.use('/assets', express.static(path.join(frontendDist, 'assets'), {
  fallthrough: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
  }
}));

app.use(express.static(frontendDist, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));


app.get('/api/health/auth', async (req, res) => {
  const env = {
    supabaseUrl: !!process.env.SUPABASE_URL,
    anonKey: !!(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY),
    serviceRoleKey: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY),
  };

  let database = 'error';
  let auth = env.serviceRoleKey ? 'error' : 'not_configured';

  let databaseError = null;
  let authError = null;

  if (!process.env.SUPABASE_URL || !(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)) {
    return res.status(200).json({
      status: 'degraded',
      environment: env,
      database: 'not_checked',
      auth: env.serviceRoleKey ? 'not_checked' : 'not_configured',
      debug: {
        databaseError: !process.env.SUPABASE_URL ? 'SUPABASE_URL is not configured' : null,
        authError: !(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY) ? 'Service role key is not configured' : null,
      },
    });
  }

  try {
    const { data, error } = await supabase
      .from('platform_projects')
      .select('project_id')
      .limit(1);

    if (error) {
      databaseError = error.message;
    } else {
      database = 'ok';
    }
  } catch (err) {
    databaseError = err.message;
  }

  try {
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      authError = error.message;
    } else {
      auth = 'ok';
    }
  } catch (err) {
    authError = err.message;
  }

  const status =
    env.supabaseUrl &&
    env.anonKey &&
    env.serviceRoleKey &&
    database === 'ok' &&
    auth === 'ok'
      ? 'ok'
      : 'degraded';

  return res.status(200).json({
    status,
    environment: env,
    database,
    auth,
    debug: {
      databaseError,
      authError,
    },
  });
});

// In-memory Decisions Store initialized with standardized mock decisions (Phase 7)
let decisionsStore = [
  {
    id: 'dec-001',
    workspaceId: 'ws-shingil',
    workspaceName: '신길교회',
    capabilityId: 'church',
    capabilityName: 'Church Think',
    decisionType: 'BudgetApproval',
    title: '교육부서 여름 성경학교 행사 예산 승인',
    description: '중등부/고등부 공동 예산 상신건으로, 예산 한도 내에서 12%의 예비비 책정을 포함한 여름 성경학교 전체 집행건을 인가합니다.',
    recommendation: '승인 처리하되 교육관 냉방 시설 교체 보조금 500,000원은 추경 회계에서 별도 집행 권장.',
    confidence: 0.94,
    riskLevel: 'LOW',
    evidence: ['부서별 예산 집행 한계 대비표', '2025 여름 성경학교 행사 기획 계획서'],
    relatedObjects: ['voucher-102', 'ledger-501'],
    status: 'Approved',
    owner: '조상연 장로',
    createdAt: '2026-06-25T09:00:00Z',
    approvedAt: '2026-06-25T11:30:00Z',
    executedAt: '2026-06-26T02:00:00Z',
    measuredAt: null,
    feedback: { comments: '교육부서 조기 예산 배정을 통해 준비가 신속히 완료되었습니다.', satisfaction: 5 },
    learningScore: 92,
    history: [
      { status: 'Generated', timestamp: '2026-06-25T09:00:00Z', details: '예산 검토 제안서가 AI에 의해 발행되었습니다.' },
      { status: 'Reviewed', timestamp: '2026-06-25T10:15:00Z', details: '재정위원회의 1차 검토 완료.' },
      { status: 'Approved', timestamp: '2026-06-25T11:30:00Z', details: '당회 당결 최종 승인.' }
    ]
  },
  {
    id: 'dec-002',
    workspaceId: 'ws-invest',
    workspaceName: '내 투자계정',
    capabilityId: 'stock',
    capabilityName: 'Stock Think',
    decisionType: 'AssetAllocation',
    title: '삼성전자 분기 배당 가치 기반 추가 매수 추천',
    description: '삼성전자 주가가 최근 단기 밸류에이션 하단 영역에 도달함에 따라, 향후 배당 수익률 3.8% 기대를 감안한 추가 자산 매수를 제안합니다.',
    recommendation: '보유 현금의 15% 비중으로 분할 매수 실행, 목표 주가 82,000원 설정.',
    confidence: 0.88,
    riskLevel: 'MEDIUM',
    evidence: ['분기 재무 분석 지표 보고서', '업종별 PER-PBR 멀티플 차트'],
    relatedObjects: ['ticker-005930'],
    status: 'Learned',
    owner: '나종민(개인)',
    createdAt: '2026-06-24T14:20:00Z',
    approvedAt: '2026-06-24T15:00:00Z',
    executedAt: '2026-06-24T15:30:00Z',
    measuredAt: '2026-06-28T09:00:00Z',
    feedback: { comments: '매수 이후 2.1% 반등하여 양호한 진입점으로 확인됨.', satisfaction: 4 },
    learningScore: 88,
    history: [
      { status: 'Generated', timestamp: '2026-06-24T14:20:00Z', details: 'AI 가치 평가 모델 진입 시그널 발생.' },
      { status: 'Approved', timestamp: '2026-06-24T15:00:00Z', details: '사용자 매수 주문 승인.' },
      { status: 'Executed', timestamp: '2026-06-24T15:30:00Z', details: '체결 및 포트폴리오 편입 완료.' }
    ]
  },
  {
    id: 'dec-003',
    workspaceId: 'ws-seoul',
    workspaceName: '서울권 분석',
    capabilityId: 'estate',
    capabilityName: 'Estate Think',
    decisionType: 'PropertyPurchase',
    title: '목동 재건축 3단지 실거래가 분석 기반 소형 아파트 매입',
    description: '목동 재건축 3단지 소형 면적의 전세가 비율이 55%를 유지하고 시세 하단 갭이 조밀해짐에 따라 투자 가치가 상승했습니다.',
    recommendation: '재건축 진행 속도를 감안해 24평형 급매물 위주로 갭 매입 실행 권장.',
    confidence: 0.82,
    riskLevel: 'HIGH',
    evidence: ['목동 3단지 실거래가 변동 곡선', '재건축 안전진단 통과 이력'],
    relatedObjects: ['zone-mokdong-3'],
    status: 'Executed',
    owner: '나종민(개인)',
    createdAt: '2026-06-20T10:00:00Z',
    approvedAt: '2026-06-21T09:00:00Z',
    executedAt: '2026-06-23T11:00:00Z',
    measuredAt: null,
    feedback: null,
    learningScore: 0,
    history: [
      { status: 'Generated', timestamp: '2026-06-20T10:00:00Z', details: '실거래 분석기에서 갭 투자 기준 충감지.' },
      { status: 'Approved', timestamp: '2026-06-21T09:00:00Z', details: '투자 매입 최종 결정.' },
      { status: 'Executed', timestamp: '2026-06-23T11:00:00Z', details: '매매 계약 체결 및 에스크로 설정.' }
    ]
  }
];

// In-memory Research Store (Phase 8 Stock Think)
let researchStore = [
  {
    id: 'res-101',
    question: '삼성전자 지금 추가 매수 해도 괜찮을까?',
    ticker: '삼성전자',
    market: 'KOSPI',
    portfolio: { holdingPrice: 72000, holdingQuantity: 150 },
    investmentStyle: 'Long-term Growth',
    hypothesis: '단기 주가 과매도 국면 진입 및 배당 메리트 부각으로 분할 추가 매수 적기',
    evidence: [
      { category: 'Financials', title: '분기 영업이익 전분기 대비 14.5% 증가', status: 'Positive' },
      { category: 'Valuation', title: 'PER 11.2배로 5개년 평균 하단 도달', status: 'Positive' },
      { category: 'Sentiment', title: '반도체 공급 과잉 해소 전망 뉴스 우세', status: 'Neutral' },
      { category: 'Technicals', title: 'RSI(14) 지표 32로 과매도 국면 접근', status: 'Positive' }
    ],
    analysis: 'DRAM 가격 하방 지지와 파운드리 수주 회복 가능성이 단기 주가 반등을 지지합니다.',
    decision: {
      id: 'dec-101',
      decisionType: 'StockBuyHoldSell',
      title: '삼성전자 추가 매수 의사결정',
      recommendation: 'BUY (분할 추가 매수)',
      confidence: 0.82,
      riskLevel: 'MEDIUM',
      targetPrice: 78000,
      stopLoss: 64000,
      expectedPeriod: '6 Months',
      status: 'Learned'
    },
    validation: {
      trackedDays: 30,
      targetReached: true,
      stopLossTriggered: false,
      actualPrice30d: 78200,
      accuracyEvaluated: true
    },
    outcome: {
      returnRate: 23.7,
      success: true,
      timestamp: '2026-06-25T04:00:00Z'
    },
    learning: '과매도 시그널(RSI) 기반 분할 매수 전략의 유효성 검증 완료.',
    createdAt: '2026-05-25T09:00:00Z'
  },
  {
    id: 'res-102',
    question: '현대차 매도 시점은 언제로 잡아야 하나?',
    ticker: '현대차',
    market: 'KOSPI',
    portfolio: { holdingPrice: 195000, holdingQuantity: 80 },
    investmentStyle: 'Value Investing',
    hypothesis: '친환경 신차 사이클 호조이나 거시 금리 부담으로 단기 고점 분할 차익 실현 권장',
    evidence: [
      { category: 'Financials', title: '영업이익률 8.4%로 역대 최고치 유지', status: 'Positive' },
      { category: 'Valuation', title: 'PBR 0.65배로 장기 평균 상단 터치', status: 'Neutral' },
      { category: 'Macro', title: '고금리 장기화에 따른 글로벌 차입 구매 수요 둔화 우려', status: 'Negative' },
      { category: 'Technicals', title: '볼린저 밴드 상단 터치 후 거래량 소폭 감소', status: 'Negative' }
    ],
    analysis: '호실적은 선반영되었으며, 환율 효과 둔화 및 금리 영향으로 박스권 상단 저항 예상.',
    decision: {
      id: 'dec-102',
      decisionType: 'StockBuyHoldSell',
      title: '현대차 분할 매도 의사결정',
      recommendation: 'HOLD (목표가 도달 시 분할 매도)',
      confidence: 0.74,
      riskLevel: 'LOW',
      targetPrice: 220000,
      stopLoss: 185000,
      expectedPeriod: '3 Months',
      status: 'Learned'
    },
    validation: {
      trackedDays: 30,
      targetReached: false,
      stopLossTriggered: false,
      actualPrice30d: 202000,
      accuracyEvaluated: true
    },
    outcome: {
      returnRate: 3.5,
      success: true,
      timestamp: '2026-06-27T02:00:00Z'
    },
    learning: '금리 모멘텀 둔화 시 박스권 상단 트레이딩 전략 유효.',
    createdAt: '2026-05-27T10:00:00Z'
  }
];

app.get('/api/research', authenticateToken, (req, res) => {
  res.json(researchStore);
});

app.post('/api/research', authenticateToken, (req, res) => {
  const newRes = {
    id: `res-${Date.now().toString().slice(-3)}`,
    question: req.body.question || '종목 분석 제안',
    ticker: req.body.ticker || '삼성전자',
    market: req.body.market || 'KOSPI',
    portfolio: req.body.portfolio || { holdingPrice: 0, holdingQuantity: 0 },
    investmentStyle: req.body.investmentStyle || 'Moderate Growth',
    hypothesis: req.body.hypothesis || 'AI 생성 분석 가설',
    evidence: req.body.evidence || [],
    analysis: req.body.analysis || '',
    decision: req.body.decision || null,
    validation: req.body.validation || null,
    outcome: req.body.outcome || null,
    learning: req.body.learning || null,
    createdAt: new Date().toISOString()
  };
  researchStore.unshift(newRes);
  res.status(201).json(newRes);
});

app.get('/api/decisions', authenticateToken, enforceContextSecurity, (req, res) => {
  const scope = req.contextScope;
  if (!scope.canViewChurchWide) {
    const filtered = decisionsStore.filter(d => {
      if (d.workspaceId === 'ws-church') {
        return scope.canViewAllCommittees || (d.committeeId && scope.allowedCommitteeIds.includes(parseInt(d.committeeId, 10)));
      }
      return true;
    });
    return res.json(filtered);
  }
  res.json(decisionsStore);
});

app.get('/api/decisions/:id', authenticateToken, enforceContextSecurity, (req, res) => {
  const item = decisionsStore.find(d => d.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Decision not found' });
  
  const scope = req.contextScope;
  if (!scope.canViewChurchWide && item.workspaceId === 'ws-church') {
    if (item.committeeId && !scope.allowedCommitteeIds.includes(parseInt(item.committeeId, 10))) {
      return res.status(403).json({ error: 'FORBIDDEN_CONTEXT', message: '해당 의사결정 내역을 조회할 권한이 없습니다.' });
    }
  }
  res.json(item);
});

app.post('/api/decisions', authenticateToken, (req, res) => {
  const newDec = {
    id: `dec-${Date.now().toString().slice(-4)}`,
    workspaceId: req.body.workspaceId || 'ws-generic',
    workspaceName: req.body.workspaceName || 'Platform Workspace',
    capabilityId: req.body.capabilityId || 'generic',
    capabilityName: req.body.capabilityName || 'Platform Tool',
    decisionType: req.body.decisionType || 'GeneralDecision',
    title: req.body.title || '신규 의사결정 과제',
    description: req.body.description || '',
    recommendation: req.body.recommendation || '',
    confidence: req.body.confidence || 0.70,
    riskLevel: req.body.riskLevel || 'MEDIUM',
    evidence: req.body.evidence || [],
    relatedObjects: req.body.relatedObjects || [],
    status: req.body.status || 'Generated',
    owner: req.user.name || 'PLATFORM_ADMIN',
    createdAt: new Date().toISOString(),
    approvedAt: null,
    executedAt: null,
    measuredAt: null,
    feedback: null,
    learningScore: 0,
    history: [
      { status: 'Generated', timestamp: new Date().toISOString(), details: '의사결정 제안이 상신되었습니다.' }
    ]
  };
  decisionsStore.unshift(newDec);
  res.status(201).json(newDec);
});

app.patch('/api/decisions/:id/status', authenticateToken, (req, res) => {
  const item = decisionsStore.find(d => d.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Decision not found' });
  
  const oldStatus = item.status;
  item.status = req.body.status;
  
  if (item.status === 'Approved') item.approvedAt = new Date().toISOString();
  if (item.status === 'Executed') item.executedAt = new Date().toISOString();
  if (item.status === 'Measured') item.measuredAt = new Date().toISOString();

  item.history.push({
    status: item.status,
    timestamp: new Date().toISOString(),
    details: `의사결정 상태 변경: ${oldStatus} ➡️ ${item.status}`
  });

  res.json(item);
});

app.post('/api/decisions/:id/feedback', authenticateToken, (req, res) => {
  const item = decisionsStore.find(d => d.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Decision not found' });

  item.feedback = {
    comments: req.body.comments || '',
    satisfaction: req.body.satisfaction || 5
  };
  item.learningScore = req.body.learningScore || 90;
  item.status = 'Learned';
  
  item.history.push({
    status: 'Learned',
    timestamp: new Date().toISOString(),
    details: `피드백 수렴 완료. 학습 점수: ${item.learningScore}점 등록.`
  });

  res.json(item);
});

// 8. 플랫폼 및 모듈 초기화 부트스트랩
const { startQueueWorker } = require('./core/ai.js');

async function startServer() {
  try {
    // 1. Initialize Platform Core database
    await initPlatformDb();
    
    // 2. Load all service modules dynamically
    await loadModules(app);
    
    // 2b. Register fallback wildcard route at the very bottom of Express stack
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
      }

      if (req.path.startsWith('/assets')) {
        return res.status(404).send('Asset not found');
      }

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
    
    // 3. Start AI queue processing
    if (typeof startQueueWorker === 'function') {
      await startQueueWorker();
    } else {
      console.warn('[Queue] Worker not available. Skipping.');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Platform Server] Running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Platform Server] Failed to initialize:', err);
  }
}

startServer();
