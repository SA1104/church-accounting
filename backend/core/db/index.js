const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Strict Production Env Guard
if (process.env.NODE_ENV === 'production') {
  const missing = [];
  if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('your-supabase-project')) missing.push('SUPABASE_URL');
  
  const hasServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your-service-role-key';
  const hasSecretKey = process.env.SUPABASE_SECRET_KEY && process.env.SUPABASE_SECRET_KEY !== 'your-service-role-key';
  if (!hasServiceKey && !hasSecretKey) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }

  if (missing.length > 0) {
    console.error(`FATAL [Startup Guard]: Missing required production environment variables: ${missing.join(', ')}. Exiting.`);
    process.exit(1);
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

let useSupabaseClientOnly = !process.env.DATABASE_URL;
let useMocks = false;

let runMockQuery = null;
if (process.env.NODE_ENV !== 'production') {
  try {
    runMockQuery = require('./mock-data.js').runMockQuery;
  } catch (e) {
    console.error('Failed to load mock data', e);
  }
}

let pool = null;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Auto detect sandboxed mode
if (SUPABASE_URL.includes('your-supabase-project') || SUPABASE_URL.includes('booza-think')) {
  console.log('[Platform DB] Dummy Supabase URL detected. Enabling Local Mock Database mode.');
  useMocks = true;
}

if (process.env.NODE_ENV === 'production' && useMocks) {
  console.error('FATAL [Startup Guard]: Production environment detected, but Mock DB fallback is active. Exiting to prevent data corruption.');
  process.exit(1);
}

if (useSupabaseClientOnly) {
  console.log('[Platform DB] DATABASE_URL is not set. Using Supabase JS Client for all queries.');
} else {
  console.log('[Platform DB] DATABASE_URL is set. Using direct PostgreSQL connection pool.');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
}

const query = {
  run: async (sql, params = []) => {
    if (useMocks) {
      const data = runMockQuery(sql, params);
      const firstRow = data && data[0];
      const id = firstRow ? (firstRow.id || firstRow.file_id || firstRow.voucher_id || Object.values(firstRow)[0]) : null;
      return { id, changes: data ? data.length : 0 };
    }
    if (useSupabaseClientOnly) {
      const { data, error } = await supabase.rpc('exec_sql', {
        query_text: sql,
        params: params
      });
      if (error) {
        console.error('Supabase Client Query Run Error:', error);
        throw error;
      }
      const firstRow = data && data[0];
      const id = firstRow ? (firstRow.id || firstRow.file_id || firstRow.voucher_id || Object.values(firstRow)[0]) : null;
      const changes = firstRow && firstRow.changes !== undefined ? firstRow.changes : (data ? data.length : 0);
      return { id, changes };
    } else {
      let index = 1;
      const pgSql = sql.replace(/\?/g, () => `$${index++}`);
      const res = await pool.query(pgSql, params);
      const lastRow = res.rows && res.rows[0];
      const id = lastRow ? (lastRow.id || lastRow.file_id || lastRow.voucher_id || Object.values(lastRow)[0]) : null;
      return { id, changes: res.rowCount };
    }
  },
  get: async (sql, params = []) => {
    if (useMocks) {
      const data = runMockQuery(sql, params);
      return (data && data[0]) || null;
    }
    if (useSupabaseClientOnly) {
      const { data, error } = await supabase.rpc('exec_sql', {
        query_text: sql,
        params: params
      });
      if (error) {
        console.error('Supabase Client Query Get Error:', error);
        throw error;
      }
      return (data && data[0]) || null;
    } else {
      let index = 1;
      const pgSql = sql.replace(/\?/g, () => `$${index++}`);
      const res = await pool.query(pgSql, params);
      return res.rows[0] || null;
    }
  },
  all: async (sql, params = []) => {
    if (useMocks) {
      return runMockQuery(sql, params);
    }
    if (useSupabaseClientOnly) {
      const { data, error } = await supabase.rpc('exec_sql', {
        query_text: sql,
        params: params
      });
      if (error) {
        console.error('Supabase Client Query All Error:', error);
        throw error;
      }
      return data || [];
    } else {
      let index = 1;
      const pgSql = sql.replace(/\?/g, () => `$${index++}`);
      const res = await pool.query(pgSql, params);
      return res.rows;
    }
  },
  exec: async (sql) => {
    if (useMocks) {
      return;
    }
    if (useSupabaseClientOnly) {
      const { error } = await supabase.rpc('exec_sql', {
        query_text: sql,
        params: []
      });
      if (error) {
        console.error('Supabase Client Exec Error:', error);
        throw error;
      }
    } else {
      await pool.query(sql);
    }
  }
};

async function seedDefaultUsers(supabaseClient) {
  let defaultUsers = [];
  if (process.env.NODE_ENV !== 'production') {
    try {
      defaultUsers = require('./mock-data.js').defaultUsers || [];
    } catch(e) {}
  }

  const projectId = '8a510c4f-c006-4442-8924-f3c75ab73cf6';

  for (const u of defaultUsers) {
    const email = `${u.username}@boozathink.com`;
    
    // Check if user already exists
    let userRecord = await query.get('SELECT user_id FROM platform_profiles WHERE username = ?', [u.username]);
    let userId = userRecord ? userRecord.user_id : null;
    
    if (!userId) {
      console.log(`[Seed] Creating auth user: ${email}...`);
      const { data, error } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name }
      });
      
      if (error) {
        console.error(`[Seed] Failed to create auth user ${email}:`, error.message);
        continue;
      }
      userId = data.user.id;
      console.log(`[Seed] User created successfully with UUID: ${userId}`);
    }

    const targetRole = u.role === 'SYSTEM_ADMIN' ? 'super_admin' :
                       (u.role === 'AUDITOR' ? 'service_admin' : 'user');

    // 1. platform_project_members
    await query.run(`
      INSERT INTO platform_project_members (project_id, user_id, role_id)
      VALUES (?, ?, ?)
      ON CONFLICT (project_id, user_id) DO NOTHING
    `, [projectId, userId, targetRole]);

    // 2. platform_role_assignments
    await query.run(`
      INSERT INTO platform_role_assignments (user_id, service_id, project_id, role_id)
      VALUES (?, 'church_think', ?, ?)
      ON CONFLICT (user_id, service_id, project_id, role_id) DO NOTHING
    `, [userId, projectId, targetRole]);

    // Get department_id for groupName
    const dept = await query.get('SELECT department_id FROM church_departments WHERE name = ? AND project_id = ?', [u.groupName, projectId]);
    const deptId = dept ? dept.department_id : null;

    // 3. church_user_metadata
    await query.run(`
      INSERT INTO church_user_metadata (user_id, project_id, department_id, position, signature)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (user_id) DO NOTHING
    `, [userId, projectId, deptId, u.position, `${u.name} (${u.position}) (??`]);
  }
  console.log('[Seed] Default users checks and synchronization completed.');
}

async function initPlatformDb() {
  try {
    if (useMocks) {
      console.log('[Platform DB] Mock DB is enabled. Bypassing Supabase connection check and user seeding.');
      await seedPlatformRegistries();
      return;
    }
    
    const tConnStart = Date.now();
    if (useSupabaseClientOnly) {
      console.log('Testing Supabase Client connection...');
      const { data, error } = await supabase.rpc('exec_sql', {
        query_text: 'SELECT NOW()',
        params: []
      });
      if (error) throw error;
      console.log(`Supabase Client RPC Success: ${data[0].now} (${Date.now() - tConnStart}ms)`);
    } else {
      console.log('Testing Supabase PostgreSQL Connection...');
      const res = await pool.query('SELECT NOW()');
      console.log(`Supabase PostgreSQL Connection Success: ${res.rows[0].now} (${Date.now() - tConnStart}ms)`);
    }
    
    if (process.env.NODE_ENV === 'production' && process.env.RUN_AUTO_SEED !== 'true') {
      console.log('[Platform DB] Skipping auto-seed in production environment (RUN_AUTO_SEED is not true).');
      return;
    }
    
    // Auto seed default users on startup
    const tSeedStart = Date.now();
    await seedDefaultUsers(supabase);
    await seedPlatformRegistries();
    console.log(`[Platform DB] Seeding completed in ${Date.now() - tSeedStart}ms`);
  } catch (err) {
    console.error('Failed to connect to Supabase database:', err);
    throw err;
  }
}

async function runAssignmentsMigration() {
  console.log('[DB] Running assignments schema migration...');
  const sqls = [
    `CREATE TABLE IF NOT EXISTS public.church_positions (
      position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL,
      name TEXT NOT NULL,
      role_code TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      status VARCHAR(20) DEFAULT 'approved',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_project_position_name UNIQUE (project_id, name)
    )`,
    `CREATE TABLE IF NOT EXISTS public.church_user_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      project_id UUID NOT NULL,
      committee_id INTEGER NOT NULL,
      group_id INTEGER NULL,
      position_id UUID NOT NULL,
      role_code TEXT NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      status VARCHAR(20) DEFAULT 'approved',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by UUID NULL,
      updated_by UUID NULL,
      assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      revoked_at TIMESTAMP WITH TIME ZONE NULL,
      FOREIGN KEY (position_id) REFERENCES public.church_positions(position_id) ON DELETE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_assignment_per_user_project
     ON public.church_user_assignments(user_id, project_id)
     WHERE is_primary = TRUE AND is_active = TRUE`,
    `CREATE TABLE IF NOT EXISTS public.church_signup_assignment_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      project_id UUID NOT NULL,
      committee_id INTEGER NOT NULL,
      group_id INTEGER NULL,
      position_id UUID NULL,
      requested_position_name TEXT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      approved_at TIMESTAMP WITH TIME ZONE NULL,
      approved_by UUID NULL
    )`
  ];

  for (const sql of sqls) {
    try {
      await query.exec(sql);
    } catch (err) {
      console.warn('[DB] Migration step warning/error:', err.message);
    }
  }
  console.log('[DB] Assignments schema migration completed.');
}

async function seedDefaultPositions() {
  console.log('[Seed] Seeding default positions...');
  try {
    const project = await query.get("SELECT project_id FROM public.platform_projects WHERE service_id = 'church_think' LIMIT 1");
    if (!project) {
      console.warn('[Seed] No project found for church_think, skipping position seeding.');
      return;
    }
    const projectId = project.project_id;
    let defaults = [];
    if (process.env.NODE_ENV !== 'production') {
      try {
        defaults = require('./mock-data.js').defaultPositions || [];
      } catch(e) {}
    }

    for (const pos of defaults) {
      await query.run(`
        INSERT INTO public.church_positions (project_id, name, role_code)
        VALUES (?, ?, ?)
        ON CONFLICT (project_id, name) DO NOTHING
      `, [projectId, pos.name, pos.role_code]);
    }
    console.log('[Seed] Seeding default positions completed.');
  } catch (err) {
    console.error('[Seed] Failed to seed default positions:', err);
  }
}

async function migrateExistingUsersToAssignments() {
  console.log('[Migration] Migrating existing users to assignments...');
  try {
    const project = await query.get("SELECT project_id FROM public.platform_projects WHERE service_id = 'church_think' LIMIT 1");
    if (!project) return;
    const projectId = project.project_id;

    const positions = await query.all("SELECT position_id, name, role_code FROM public.church_positions WHERE project_id = ? AND is_active = TRUE", [projectId]);
    const usersMeta = await query.all("SELECT user_id, department_id, position FROM public.church_user_metadata WHERE project_id = ?", [projectId]);

    for (const meta of usersMeta) {
      const existing = await query.all("SELECT id FROM public.church_user_assignments WHERE user_id = ? AND project_id = ? AND is_active = TRUE", [meta.user_id, projectId]);
      if (existing && existing.length > 0) continue;

      const profile = await query.get("SELECT username FROM public.platform_profiles WHERE user_id = ?", [meta.user_id]);
      if (profile && (profile.username === 'admin' || profile.username === 'auditor')) {
        continue;
      }

      let groupId = meta.department_id;
      let committeeId = 11;
      if (groupId) {
        const group = await query.get("SELECT parent_id FROM public.church_departments WHERE department_id = ?", [groupId]);
        if (group && group.parent_id) {
          committeeId = group.parent_id;
        } else {
          committeeId = groupId;
          groupId = null;
        }
      }

      let posName = meta.position || '?뚭퀎';
      let matchedPos = positions.find(p => p.name === posName);
      if (!matchedPos) {
        matchedPos = positions.find(p => p.name === '?뚭퀎');
      }

      if (matchedPos) {
        await query.run(`
          INSERT INTO public.church_user_assignments (user_id, project_id, committee_id, group_id, position_id, role_code, is_primary)
          VALUES (?, ?, ?, ?, ?, ?, TRUE)
        `, [meta.user_id, projectId, committeeId, groupId, matchedPos.position_id, matchedPos.role_code]);
        console.log(`[Migration] Created assignment for user ${meta.user_id}: Committee ${committeeId}, Group ${groupId}, Position ${matchedPos.name}`);
      }
    }
    console.log('[Migration] Existing users migration completed.');
  } catch (err) {
    console.error('[Migration] Failed to migrate existing users:', err);
  }
}

async function seedPlatformRegistries() {
  // 1. Check platform_registries existence
  let registriesExists = false;
  try {
    const res = await query.get("SELECT to_regclass('public.platform_registries') AS platform_registries_exists");
    if (res && res.platform_registries_exists) {
      registriesExists = true;
    }
  } catch (err) {
    console.warn('[DB] Error checking public.platform_registries table:', err.message);
  }

  if (!registriesExists) {
    console.warn('[DB] Warning: public.platform_registries table does not exist. Skipping platform registry seeding.');
  }

  // 2. Check decision_histories existence
  let decisionHistoriesExists = false;
  try {
    const res = await query.get("SELECT to_regclass('public.decision_histories') AS decision_histories_exists");
    if (res && res.decision_histories_exists) {
      decisionHistoriesExists = true;
    }
  } catch (err) {
    console.warn('[DB] Error checking public.decision_histories table:', err.message);
  }

  if (!decisionHistoriesExists) {
    console.warn('[DB] Warning: public.decision_histories table does not exist. Decision history features may be limited.');
  }

  // If platform_registries doesn't exist, skip seeding to avoid crashes
  if (!registriesExists) {
    return;
  }

  console.log('[Seed] Seeding platform registries...');
  try {
    // 1. Products
    const products = [
      { key: 'church_think', name: 'Church Think', owner: 'FINANCE_COMM', enabled: true },
      { key: 'stock_think', name: 'Stock Think', owner: 'INVEST_COMM', enabled: false },
      { key: 'estate_think', name: 'Estate Think', owner: 'ESTATE_COMM', enabled: false },
      { key: 'mission_think', name: 'Mission Think', owner: 'MISSION_COMM', enabled: false },
      { key: 'education_think', name: 'Education Think', owner: 'EDU_COMM', enabled: false },
      { key: 'finance_think', name: 'Finance Think', owner: 'FINANCE_COMM', enabled: false },
      { key: 'construction_think', name: 'Construction Think', owner: 'BUILD_COMM', enabled: false },
      { key: 'manufacturing_think', name: 'Manufacturing Think', owner: 'MFG_COMM', enabled: false },
      { key: 'medical_think', name: 'Medical Think', owner: 'MED_COMM', enabled: false },
      { key: 'legal_think', name: 'Legal Think', owner: 'LEGAL_COMM', enabled: false },
      { key: 'hr_think', name: 'HR Think', owner: 'HR_COMM', enabled: false },
      { key: 'esg_think', name: 'ESG Think', owner: 'ESG_COMM', enabled: false }
    ];

    for (const p of products) {
      await query.run(`
        INSERT INTO platform_registries (registry_type, item_key, item_name, owner, enabled)
        VALUES ('PRODUCT', ?, ?, ?, ?)
        ON CONFLICT (registry_type, item_key) DO NOTHING
      `, [p.key, p.name, p.owner, p.enabled]);
    }

    // 2. Engines (18 Core Engines)
    const engines = [
      'DataEngine', 'CleaningEngine', 'StandardizationEngine', 'KnowledgeEngine',
      'IntelligenceEngine', 'DecisionEngine', 'SimulationEngine', 'PredictionEngine',
      'LearningEngine', 'WorkflowEngine', 'MediaEngine', 'DistributionEngine',
      'NotificationEngine', 'PluginEngine', 'MonitoringEngine', 'BillingEngine',
      'UsageEngine', 'GovernanceEngine'
    ];

    for (const e of engines) {
      await query.run(`
        INSERT INTO platform_registries (registry_type, item_key, item_name, owner, enabled)
        VALUES ('ENGINE', ?, ?, 'PLATFORM_ADMIN', true)
        ON CONFLICT (registry_type, item_key) DO NOTHING
      `, [e, `${e} Component`]);
    }

    // 3. Plugins
    const plugins = [
      { key: 'stripe_pay', name: 'Stripe Payment Gateway Plugin' },
      { key: 'toss_pay', name: 'Toss Payments Gateway Plugin' },
      { key: 'naver_ocr', name: 'Naver Clova OCR Parsing Plugin' }
    ];

    for (const pl of plugins) {
      await query.run(`
        INSERT INTO platform_registries (registry_type, item_key, item_name, owner, enabled)
        VALUES ('PLUGIN', ?, ?, 'PLATFORM_ADMIN', true)
        ON CONFLICT (registry_type, item_key) DO NOTHING
      `, [pl.key, pl.name]);
    }
    console.log('[Seed] Seeding platform registries completed.');
  } catch (err) {
    console.error('[Seed] Failed to seed platform registries:', err);
  }
}

module.exports = {
  pool,
  query,
  initPlatformDb
};

