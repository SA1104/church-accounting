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
const { login, signup, authenticateToken, requireRole } = require('./core/auth');
const { loadModules } = require('./core/registry');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
// Duplicate health route removed; robust implementation retained later in file

// Legacy URL compatibility rewriter middleware (Forwarding to service/church)
app.use((req, res, next) => {
  if (req.url === '/api/organizations') {
    req.url = '/api/services/church/organizations';
    console.log(`[Platform Router] Rewrote legacy path: /api/organizations -> /api/services/church/organizations`);
  } else if (req.url === '/api/groups') {
    req.url = '/api/services/church/groups';
    console.log(`[Platform Router] Rewrote legacy path: /api/groups -> /api/services/church/groups`);
  }
  next();
});

const uploadDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

// 1. 공통 인증 API
app.post('/api/auth/login', login);
app.post('/api/auth/signup', signup);

// 1-1. 다교회 온보딩 공통 조회 API (미인증)
app.get('/api/churches', async (req, res) => {
  try {
    const showAll = req.query.all === 'true';
    let sql = "SELECT church_id, project_id, church_name, denomination, region, address, phone, email, homepage_url, logo_url, primary_color, secondary_color, status FROM public.church_profiles";
    const params = [];
    if (!showAll) {
      sql += " WHERE status = 'active'";
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
