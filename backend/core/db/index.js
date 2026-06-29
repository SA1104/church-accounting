const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

let useSupabaseClientOnly = !process.env.DATABASE_URL;
let useMocks = false;

let mockPasskeyCredentials = [];
let mockPasskeyChallenges = [];

let mockProfiles = [
  { user_id: 'admin-uuid-placeholder', username: 'admin', display_name: '관리자', phone: 'admin@boozathink.com', is_active: 1, signup_status: 'approved', created_at: new Date().toISOString() },
  { user_id: 'finance-uuid-placeholder', username: 'finance', display_name: '이재정', phone: 'finance@boozathink.com', is_active: 1, signup_status: 'approved', created_at: new Date().toISOString() }
];
let mockRoleAssignments = [
  { user_id: 'admin-uuid-placeholder', service_id: 'church_think', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', role_id: 'SYSTEM_ADMIN' },
  { user_id: 'finance-uuid-placeholder', service_id: 'church_think', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', role_id: 'FINANCE_MANAGER' }
];
let mockUserMetadata = [
  { user_id: 'admin-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', department_id: null, position: '마스터', signature: '관리자 (인)' },
  { user_id: 'finance-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', department_id: 11, position: '위원장', signature: '이재정 (인)' }
];
let mockDepartments = [
  { department_id: 11, parent_id: null, name: '예배위원회', description: '예배 위원회', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', is_active: true },
  { department_id: 3, parent_id: null, name: '교육위원회', description: '교육 위원회', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', is_active: true },
  { department_id: 5, parent_id: null, name: '선교위원회', description: '선교 위원회', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', is_active: true },
  { department_id: 1, parent_id: 11, name: '시온찬양대', description: '시온찬양대', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', is_active: true },
  { department_id: 2, parent_id: 11, name: '예뜰찬양대', description: '예뜰찬양대', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', is_active: true }
];
let mockVouchers = [];
let mockVoucherItems = [];
let mockApprovalLines = [];
let mockApprovalActions = [];
let mockPeriodLocks = [];

// Mock database query runner for offline/sandboxed execution
function runMockQuery(sql, params) {
  const sqlNormalized = sql.toLowerCase().trim();

  // 1. Passkey challenges
  if (sqlNormalized.startsWith('insert into public.passkey_challenges')) {
    const userId = params[0];
    const challenge = params[1];
    const type = params[2];
    const expiresAt = params[3];
    mockPasskeyChallenges.push({
      id: `${Math.random()}`,
      user_id: userId,
      challenge,
      type,
      expires_at: new Date(expiresAt)
    });
    return [{ id: 'mock-challenge-id' }];
  }
  if (sqlNormalized.startsWith('select * from public.passkey_challenges')) {
    const challenge = params[0];
    const type = params[1];
    const now = new Date();
    const found = mockPasskeyChallenges.find(c => c.challenge === challenge && c.type === type && c.expires_at > now);
    return found ? [found] : [];
  }
  if (sqlNormalized.startsWith('delete from public.passkey_challenges')) {
    const challenge = params[0];
    mockPasskeyChallenges = mockPasskeyChallenges.filter(c => c.challenge !== challenge);
    return [];
  }

  // 2. Passkey credentials
  if (sqlNormalized.startsWith('select * from public.passkey_credentials') || sqlNormalized.includes('from public.passkey_credentials')) {
    if (sqlNormalized.includes('credential_id = ?')) {
      const credId = params[0];
      const found = mockPasskeyCredentials.find(c => c.credential_id === credId);
      return found ? [found] : [];
    }
    if (sqlNormalized.includes('user_id = ?')) {
      const userId = params[0];
      const found = mockPasskeyCredentials.filter(c => c.user_id === userId);
      return found;
    }
  }
  if (sqlNormalized.startsWith('insert into public.passkey_credentials')) {
    const userId = params[0];
    const credentialId = params[1];
    const publicKey = params[2];
    const counter = params[3];
    const transports = params[4];
    const deviceName = params[5];
    const backedUp = params[6];
    const credentialDeviceType = params[7];
    mockPasskeyCredentials.push({
      id: `mock-uuid-${Math.random()}`,
      user_id: userId,
      credential_id: credentialId,
      public_key: publicKey,
      counter: parseInt(counter, 10) || 0,
      transports: Array.isArray(transports) ? transports : [],
      device_name: deviceName,
      backed_up: !!backedUp,
      credential_device_type: credentialDeviceType,
      created_at: new Date().toISOString(),
      last_used_at: null
    });
    return [{ id: 'mock-cred-id' }];
  }
  if (sqlNormalized.startsWith('delete from public.passkey_credentials')) {
    const id = params[0];
    mockPasskeyCredentials = mockPasskeyCredentials.filter(c => c.id !== id && c.credential_id !== id);
    return [];
  }
  if (sqlNormalized.startsWith('update public.passkey_credentials')) {
    const counter = params[0];
    const lastUsed = params[1];
    const credId = params[2];
    const found = mockPasskeyCredentials.find(c => c.credential_id === credId);
    if (found) {
      found.counter = parseInt(counter, 10) || 0;
      found.last_used_at = lastUsed;
    }
    return [];
  }

  // 3. Profiles (Users)
  if (sqlNormalized.startsWith('insert into public.platform_profiles') || sqlNormalized.startsWith('insert into platform_profiles')) {
    const userId = params[0];
    const username = params[1];
    const displayName = params[2];
    mockProfiles.push({
      user_id: userId,
      username: username,
      display_name: displayName,
      phone: username,
      is_active: 0,
      signup_status: 'pending_approval',
      created_at: new Date().toISOString()
    });
    return [{ user_id: userId }];
  }
  if (sqlNormalized.includes('update public.platform_profiles') || sqlNormalized.includes('update platform_profiles')) {
    const status = params[0];
    const userId = params[1];
    const found = mockProfiles.find(p => p.user_id === userId);
    if (found) {
      if (sqlNormalized.includes('is_active = true') || sqlNormalized.includes('is_active = 1')) {
        found.is_active = 1;
        found.signup_status = 'approved';
      } else {
        found.signup_status = status;
      }
    }
    return [];
  }
  if (sqlNormalized.includes('platform_profiles') && (sqlNormalized.includes('username = ?') || sqlNormalized.includes('user_id = ?'))) {
    const searchVal = params[0];
    const found = mockProfiles.find(p => p.username === searchVal || p.phone === searchVal || p.user_id === searchVal);
    return found ? [found] : [];
  }
  if (sqlNormalized.includes('platform_profiles') && sqlNormalized.includes('created_at asc')) {
    return mockProfiles.map(u => {
      const meta = mockUserMetadata.find(m => m.user_id === u.user_id) || {};
      const roleAss = mockRoleAssignments.find(r => r.user_id === u.user_id) || {};
      const group = mockDepartments.find(d => d.department_id === meta.department_id) || {};
      const org = (group.parent_id ? mockDepartments.find(d => d.department_id === group.parent_id) : null) || {};
      return {
        user_id: u.user_id,
        username: u.username,
        display_name: u.display_name,
        name: u.display_name,
        phone: u.phone,
        email: u.phone,
        is_active: u.is_active,
        created_at: u.created_at,
        position: meta.position,
        group_id: meta.department_id,
        group_name: group.name || '소속 부서 없음',
        organization_name: org.name || '전체 조직',
        custom_department_name: meta.custom_department_name || null,
        custom_group_name: meta.custom_group_name || null,
        role: roleAss.role_id || 'user'
      };
    });
  }

  // 4. Role Assignments & User Metadata
  if (sqlNormalized.startsWith('insert into public.platform_role_assignments') || sqlNormalized.startsWith('insert into platform_role_assignments')) {
    const userId = params[0];
    const serviceId = params[1] || 'church_think';
    const projectId = params[2];
    const roleId = params[3];
    mockRoleAssignments.push({ user_id: userId, service_id: serviceId, project_id: projectId, role_id: roleId });
    return [];
  }
  if (sqlNormalized.startsWith('insert into public.church_user_metadata') || sqlNormalized.startsWith('insert into church_user_metadata')) {
    const userId = params[0];
    const projectId = params[1];
    const deptId = params[2];
    const groupUuid = params[3];
    const customDept = params[4];
    const customGroup = params[5];
    const position = params[6] || '회원';
    const signature = params[7];
    mockUserMetadata.push({
      user_id: userId,
      project_id: projectId,
      department_id: deptId,
      group_uuid: groupUuid,
      custom_department_name: customDept,
      custom_group_name: customGroup,
      position: position,
      signature: signature
    });
    return [];
  }
  if (sqlNormalized.startsWith('update church_user_metadata') || sqlNormalized.includes('update church_user_metadata')) {
    const deptId = params[0];
    const userId = params[1];
    const found = mockUserMetadata.find(m => m.user_id === userId);
    if (found) {
      found.department_id = deptId;
    }
    return [];
  }

  // 5. Departments (Organizations/Groups)
  if (sqlNormalized.startsWith('insert into church_departments') || sqlNormalized.startsWith('insert into public.church_departments')) {
    const projectId = params[0];
    const parentId = params[1];
    const name = params[2];
    const description = params[3];
    const churchProfileId = params[4];
    const departmentId = mockDepartments.length + 100;
    mockDepartments.push({
      department_id: departmentId,
      parent_id: parentId || null,
      name,
      description,
      project_id: projectId,
      church_profile_id: churchProfileId,
      is_active: true
    });
    return [{ department_id: departmentId, id: departmentId }];
  }
  if (sqlNormalized.includes('church_departments') && sqlNormalized.includes('parent_id is null')) {
    if (sqlNormalized.includes('name = ?')) {
      const name = params[0];
      const found = mockDepartments.find(d => d.parent_id === null && d.name === name);
      return found ? [found] : [];
    }
    return mockDepartments.filter(d => d.parent_id === null);
  }
  if (sqlNormalized.includes('church_departments') && sqlNormalized.includes('parent_id is not null')) {
    return mockDepartments.filter(d => d.parent_id !== null);
  }
  if (sqlNormalized.includes('church_departments') && sqlNormalized.includes('parent_id = ?')) {
    const parentId = params[0];
    if (sqlNormalized.includes('name = ?')) {
      const name = params[1];
      const found = mockDepartments.find(d => d.parent_id === parentId && d.name === name);
      return found ? [found] : [];
    }
    return mockDepartments.filter(d => d.parent_id === parentId);
  }

  // 6. Vouchers & Voucher Items
  if (sqlNormalized.startsWith('insert into church_vouchers') || sqlNormalized.startsWith('insert into public.church_vouchers')) {
    const projectId = params[0];
    const deptId = params[1];
    const writerId = params[2];
    const date = params[3];
    const type = params[4];
    const summary = params[5];
    const status = 'TEMP';
    const memo = params[6];
    const voucherId = mockVouchers.length + 1;
    mockVouchers.push({
      voucher_id: voucherId,
      project_id: projectId,
      department_id: deptId,
      writer_id: writerId,
      transaction_date: date,
      transaction_type: type,
      summary,
      status,
      memo
    });
    return [{ voucher_id: voucherId, id: voucherId }];
  }
  if (sqlNormalized.startsWith('insert into church_voucher_items')) {
    const voucherId = params[0];
    const categoryId = params[1];
    const amount = params[2];
    const vendor = params[3];
    const paymentMethod = params[4];
    mockVoucherItems.push({
      voucher_id: voucherId,
      category_id: categoryId,
      amount,
      vendor,
      payment_method: paymentMethod
    });
    return [];
  }
  if (sqlNormalized.includes('update church_vouchers') || sqlNormalized.includes('update public.church_vouchers')) {
    const status = params[0];
    const voucherId = params[1];
    const found = mockVouchers.find(v => v.voucher_id === voucherId);
    if (found) {
      found.status = status;
    }
    return [];
  }
  if (sqlNormalized.includes('church_vouchers') && sqlNormalized.includes('voucher_id = ?')) {
    const voucherId = params[0];
    const v = mockVouchers.find(x => x.voucher_id === voucherId);
    if (!v) return [];
    const group = mockDepartments.find(d => d.department_id === v.department_id) || {};
    const org = group.parent_id ? mockDepartments.find(d => d.department_id === group.parent_id) : {};
    const writer = mockProfiles.find(p => p.user_id === v.writer_id) || {};
    const item = mockVoucherItems.find(i => i.voucher_id === voucherId) || {};
    return [{
      voucher_id: v.voucher_id,
      project_id: v.project_id,
      department_id: v.department_id,
      writer_id: v.writer_id,
      transaction_date: v.transaction_date,
      transaction_type: v.transaction_type,
      summary: v.summary,
      status: v.status,
      memo: v.memo,
      group_name: group.name,
      organization_name: org.name,
      writer_name: writer.display_name,
      category_id: item.category_id,
      amount: item.amount,
      vendor: item.vendor,
      payment_method: item.payment_method
    }];
  }
  if (sqlNormalized.includes('church_vouchers')) {
    return mockVouchers.map(v => {
      const group = mockDepartments.find(d => d.department_id === v.department_id) || {};
      const org = group.parent_id ? mockDepartments.find(d => d.department_id === group.parent_id) : {};
      const writer = mockProfiles.find(p => p.user_id === v.writer_id) || {};
      const item = mockVoucherItems.find(i => i.voucher_id === v.voucher_id) || {};
      return {
        voucher_id: v.voucher_id,
        project_id: v.project_id,
        department_id: v.department_id,
        writer_id: v.writer_id,
        transaction_date: v.transaction_date,
        transaction_type: v.transaction_type,
        summary: v.summary,
        status: v.status,
        memo: v.memo,
        group_name: group.name,
        organization_name: org.name,
        writer_name: writer.display_name,
        category_id: item.category_id,
        amount: item.amount,
        vendor: item.vendor,
        payment_method: item.payment_method
      };
    });
  }

  // 7. Approval Lines & Actions
  if (sqlNormalized.startsWith('insert into church_approval_lines') || sqlNormalized.startsWith('insert into public.church_approval_lines')) {
    const voucherId = params[0];
    const approverId = params[1];
    const stepNumber = params[2];
    const status = params[3] || 'PENDING';
    const lineId = mockApprovalLines.length + 1;
    mockApprovalLines.push({
      line_id: lineId,
      voucher_id: voucherId,
      approver_id: approverId,
      step_number: stepNumber,
      status
    });
    return [];
  }
  if (sqlNormalized.includes('update church_approval_lines') || sqlNormalized.includes('update public.church_approval_lines')) {
    if (sqlNormalized.includes('line_id = ?')) {
      const lineId = params[0];
      const found = mockApprovalLines.find(l => l.line_id === lineId);
      if (found) found.status = 'APPROVED';
    } else if (sqlNormalized.includes('voucher_id = ?')) {
      const voucherId = params[0];
      mockApprovalLines.forEach(l => {
        if (l.voucher_id === voucherId) l.status = 'PENDING';
      });
    }
    return [];
  }
  if (sqlNormalized.includes('church_approval_lines')) {
    if (sqlNormalized.includes('status = \'pending\'') || sqlNormalized.includes('status = ?')) {
      const voucherId = params[0];
      const approverId = params[1];
      const found = mockApprovalLines.find(l => l.voucher_id === voucherId && l.approver_id === approverId && l.status === 'PENDING');
      return found ? [found] : [];
    }
    if (sqlNormalized.includes('step_number = ?')) {
      const voucherId = params[0];
      const stepNumber = params[1];
      const found = mockApprovalLines.find(l => l.voucher_id === voucherId && l.step_number === stepNumber);
      return found ? [found] : [];
    }
  }
  if (sqlNormalized.startsWith('insert into church_approval_actions')) {
    const voucherId = params[0];
    const actorId = params[1];
    const action = params[2];
    const comment = params[3];
    const signature = params[4];
    mockApprovalActions.push({
      voucher_id: voucherId,
      actor_id: actorId,
      action,
      comment,
      signature,
      created_at: new Date().toISOString()
    });
    return [];
  }

  // 8. Period locks (closing periods)
  if (sqlNormalized.startsWith('insert into church_closing_periods') || sqlNormalized.startsWith('insert into public.church_closing_periods')) {
    const projectId = params[0];
    const periodType = params[1];
    const periodValue = params[2];
    mockPeriodLocks.push({
      project_id: projectId,
      period_type: periodType,
      period_value: periodValue,
      is_locked: true
    });
    return [];
  }
  if (sqlNormalized.includes('church_closing_periods')) {
    const projectId = params[0];
    const monthVal = params[1];
    const halfVal = params[2];
    const yearVal = params[3];
    const found = mockPeriodLocks.find(p => p.project_id === projectId && (
      p.period_value === monthVal || p.period_value === halfVal || p.period_value === yearVal
    ));
    return found ? [{ period_id: 1 }] : [];
  }

  // General select/checks fallback
  if (sqlNormalized.startsWith('select now()')) {
    return [{ now: new Date().toISOString() }];
  }
  if (sqlNormalized.includes('to_regclass')) {
    if (sqlNormalized.includes('platform_registries')) {
      return [{ platform_registries_exists: 'platform_registries' }];
    }
    if (sqlNormalized.includes('decision_histories')) {
      return [{ decision_histories_exists: 'decision_histories' }];
    }
  }
  if (sqlNormalized.includes('church_user_contexts') && sqlNormalized.includes('user_id = ?')) {
    const userId = params[0];
    if (userId.includes('finance') || userId.includes('fin123')) {
      return [
        { department_id: 11, role_id: 'FINANCE_MANAGER' },
        { department_id: 3, role_id: 'FINANCE_MANAGER' }
      ];
    }
    return [];
  }
  if (sqlNormalized.includes('church_profiles')) {
    return [{ church_id: 'church-id-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6' }];
  }
  if (sqlNormalized.includes('church_ledgers')) {
    return { balance: 5200000 };
  }

  return [];
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
  const defaultUsers = [
    { username: 'admin', name: '관리자', password: 'admin123', role: 'SYSTEM_ADMIN', position: '기타', groupName: '행정지원팀' },
    { username: 'accountant', name: '김회계 담당자', password: 'acc123', role: 'DEPARTMENT_ACCOUNTANT', position: '회계', groupName: '예뜰찬양팀' },
    { username: 'depthead', name: '박부장 부서장', password: 'head123', role: 'DEPARTMENT_HEAD', position: '부장', groupName: '예뜰찬양팀' },
    { username: 'finance', name: '이재정 위원장', password: 'fin123', role: 'FINANCE_MANAGER', position: '위원장', groupName: '행정지원팀' },
    { username: 'auditor', name: '최감사 교역자', password: 'aud123', role: 'AUDITOR', position: '교역자', groupName: '행정지원팀' }
  ];

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
    `, [userId, projectId, deptId, u.position, `${u.name} (${u.position}) (인)`]);
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
    if (useSupabaseClientOnly) {
      console.log('Testing Supabase Client connection...');
      const { data, error } = await supabase.rpc('exec_sql', {
        query_text: 'SELECT NOW()',
        params: []
      });
      if (error) throw error;
      console.log('Supabase Client RPC Success:', data[0].now);
    } else {
      console.log('Testing Supabase PostgreSQL Connection...');
      const res = await pool.query('SELECT NOW()');
      console.log('Supabase PostgreSQL Connection Success:', res.rows[0].now);
    }
    
    // Auto seed default users on startup
    await seedDefaultUsers(supabase);
    await seedPlatformRegistries();
  } catch (err) {
    console.error('Failed to connect to Supabase database:', err);
    throw err;
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
