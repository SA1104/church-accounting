const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

let useSupabaseClientOnly = !process.env.DATABASE_URL;

let pool = null;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

if (useSupabaseClientOnly) {
  console.log('[Platform DB] DATABASE_URL is not set. Using Supabase JS Client for all queries (exec_sql RPC).');
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
  } catch (err) {
    console.error('Failed to connect to Supabase database:', err);
    throw err;
  }
}

module.exports = {
  pool,
  query,
  initPlatformDb
};
