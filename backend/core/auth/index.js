global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const { query } = require('../db');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || 'placeholder-service-role-key';

// Initialize Supabase clients Client to bypass RLS for backend operations
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  try {
    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Resolve user's platform profile
    const profile = await query.get(
      'SELECT username, display_name, phone, avatar_url, is_active FROM platform_profiles WHERE user_id = ?',
      [user.id]
    );

    if (!profile || !profile.is_active) {
      return res.status(403).json({ message: 'User profile is inactive or not found' });
    }

    // Resolve roles mapped across services
    const rolesRows = await query.all(
      'SELECT service_id, role_id FROM platform_role_assignments WHERE user_id = ?',
      [user.id]
    );
    const roles = {};
    rolesRows.forEach(row => {
      // Map to old roles style (SYSTEM_ADMIN, AUDITOR, etc.)
      const isSystemAdminRole = row.role_id === 'super_admin' || row.role_id === 'admin' || row.role_id === 'project_admin' || row.role_id === 'SYSTEM_ADMIN';
      roles[row.service_id] = isSystemAdminRole ? 'SYSTEM_ADMIN' : 
                              (row.role_id === 'service_admin' ? 'AUDITOR' : row.role_id);
    });

    // Check if there is accounting metadata (Church Think service mapping)
    let accountingMeta = null;
    let projectId = null;
    if (roles['church_think'] || roles['accounting']) {
      const meta = await query.get(`
        SELECT m.*, d.name as department_name 
        FROM church_user_metadata m
        LEFT JOIN church_departments d ON m.department_id = d.department_id
        WHERE m.user_id = ?
      `, [user.id]);
      
      if (meta) {
        projectId = meta.project_id;
        accountingMeta = {
          groupId: meta.department_id,
          groupName: meta.department_name,
          organizationName: '교회본부', // static fallback or derived
          position: meta.position,
          signature: meta.signature
        };
      }
    }

    const email = profile.username && profile.username.includes('@') ? profile.username : `${profile.username}@boozathink.com`;
    const isSystemAdminRole = 
      profile.username === 'admin' || 
      email === 'admin@boozathink.com' ||
      roles['platform'] === 'SYSTEM_ADMIN' || 
      roles['church_think'] === 'SYSTEM_ADMIN';

    // Bind legacy format context
    req.user = {
      userId: user.id, // Now UUID String
      id: user.id,
      email: email,
      username: profile.username,
      name: isSystemAdminRole ? '관리자' : profile.display_name,
      projectId: projectId,
      roles: {
        platform: roles['platform'] || (roles['church_think'] === 'SYSTEM_ADMIN' ? 'SYSTEM_ADMIN' : 'USER'),
        accounting: roles['church_think'] || 'USER',
        church_think: roles['church_think'] === 'SYSTEM_ADMIN' ? 'super_admin' : (roles['church_think'] || 'user')
      },
      accounting: {
        role: isSystemAdminRole ? 'admin' : (roles['church_think'] || 'USER'),
        organizationName: '신길교회',
        departmentName: accountingMeta ? accountingMeta.groupName : (isSystemAdminRole ? '전체 조직' : null),
        position: accountingMeta ? accountingMeta.position : (isSystemAdminRole ? '마스터' : '회원'),
        signature: accountingMeta ? accountingMeta.signature : null,
        groupId: accountingMeta ? accountingMeta.groupId : null,
        groupName: accountingMeta ? accountingMeta.groupName : (isSystemAdminRole ? '전체 조직' : '소속 부서 없음'),
        projectId: projectId,
        permissions: isSystemAdminRole ? [
          "settings:read",
          "settings:write",
          "users:manage",
          "organization:manage",
          "roles:manage",
          "closing:manage",
          "data:manage",
          "ai:read"
        ] : []
      },
      isAdmin: isSystemAdminRole,
      // Compatibility fields
      position: accountingMeta ? accountingMeta.position : (isSystemAdminRole ? '마스터' : '회원'),
      groupName: accountingMeta ? accountingMeta.groupName : (isSystemAdminRole ? '전체 조직' : '소속 부서 없음'),
      signature: accountingMeta ? accountingMeta.signature : null
    };

    next();
  } catch (err) {
    console.error('Token authentication error:', err);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
}

function requireRole(allowedRoles, serviceId = 'platform') {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }

    // Direct access if user is verified system-wide admin
    if (req.user.isAdmin === true) {
      return next();
    }

    const legacyServiceId = serviceId === 'accounting' ? 'church_think' : serviceId;

    // SYSTEM_ADMIN in platform service has superuser access to everything
    if (req.user.roles['platform'] === 'SYSTEM_ADMIN') {
      return next();
    }

    const userRole = req.user.roles[legacyServiceId];
    if (userRole && allowedRoles.includes(userRole)) {
      return next();
    }

    // Map system role string compatibility
    const systemAdminEquiv = allowedRoles.includes('SYSTEM_ADMIN') && userRole === 'super_admin';
    const auditorEquiv = allowedRoles.includes('AUDITOR') && userRole === 'service_admin';
    if (systemAdminEquiv || auditorEquiv) {
      return next();
    }

    return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
  };
}

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  // Determine email format: if input is already email, use as-is; otherwise append system domain
  const email = username.includes('@') ? username : `${username}@boozathink.com`;

  // Log only email and keys of req.body (do not log the password)
  console.log('[AUTH LOGIN REQUEST]', { email, bodyKeys: Object.keys(req.body) });

  try {
    const { data, error } = await supabasePublic.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      console.error('[AUTH LOGIN ERROR]', { 
        email, 
        message: error ? error.message : 'No user returned from Supabase', 
        status: error ? error.status : null 
      });
      return res.status(400).json({ message: 'Invalid login credentials' });
    }

    // Resolve user's profile (including database username) and roles
    const profile = await query.get('SELECT username, display_name, is_active FROM platform_profiles WHERE user_id = ?', [data.user.id]);
    if (!profile || !profile.is_active) {
      return res.status(400).json({ message: 'Profile is inactive' });
    }

    const rolesRows = await query.all('SELECT service_id, role_id FROM platform_role_assignments WHERE user_id = ?', [data.user.id]);
    const roles = {};
    rolesRows.forEach(row => {
      const isSystemAdminRole = row.role_id === 'super_admin' || row.role_id === 'admin' || row.role_id === 'project_admin' || row.role_id === 'SYSTEM_ADMIN';
      roles[row.service_id] = isSystemAdminRole ? 'SYSTEM_ADMIN' : 
                              (row.role_id === 'service_admin' ? 'AUDITOR' : row.role_id);
    });

    let accountingMeta = null;
    const meta = await query.get(`
      SELECT m.*, d.name as department_name 
      FROM church_user_metadata m
      LEFT JOIN church_departments d ON m.department_id = d.department_id
      WHERE m.user_id = ?
    `, [data.user.id]);
    
    if (meta) {
      accountingMeta = {
        groupId: meta.department_id,
        groupName: meta.department_name,
        organizationName: '교회본부',
        position: meta.position,
        signature: meta.signature
      };
    }

    const isSystemAdminRole = 
      (profile.username || username) === 'admin' || 
      email === 'admin@boozathink.com' ||
      roles['platform'] === 'SYSTEM_ADMIN' || 
      roles['church_think'] === 'SYSTEM_ADMIN';

    const responsePayload = {
      token: data.session.access_token,
      user: {
        userId: data.user.id,
        id: data.user.id,
        email: email,
        username: profile.username || username,
        name: isSystemAdminRole ? '관리자' : profile.display_name,
        role: isSystemAdminRole ? 'admin' : (roles['church_think'] || 'USER'),
        roles: {
          platform: roles['platform'] || (roles['church_think'] === 'SYSTEM_ADMIN' ? 'SYSTEM_ADMIN' : 'USER'),
          accounting: roles['church_think'] || 'USER',
          church_think: roles['church_think'] === 'SYSTEM_ADMIN' ? 'super_admin' : (roles['church_think'] || 'user')
        },
        accounting: {
          role: isSystemAdminRole ? 'admin' : (roles['church_think'] || 'USER'),
          organizationName: '신길교회',
          departmentName: accountingMeta ? accountingMeta.groupName : (isSystemAdminRole ? '전체 조직' : null),
          position: accountingMeta ? accountingMeta.position : (isSystemAdminRole ? '마스터' : '회원'),
          signature: accountingMeta ? accountingMeta.signature : null,
          groupId: accountingMeta ? accountingMeta.groupId : null,
          groupName: accountingMeta ? accountingMeta.groupName : (isSystemAdminRole ? '전체 조직' : '소속 부서 없음'),
          permissions: isSystemAdminRole ? [
            "settings:read",
            "settings:write",
            "users:manage",
            "organization:manage",
            "roles:manage",
            "closing:manage",
            "data:manage",
            "ai:read"
          ] : []
        },
        // Compatibility fields
        position: accountingMeta ? accountingMeta.position : (isSystemAdminRole ? '마스터' : '회원'),
        groupName: accountingMeta ? accountingMeta.groupName : (isSystemAdminRole ? '전체 조직' : '소속 부서 없음'),
        signature: accountingMeta ? accountingMeta.signature : null,
        isAdmin: isSystemAdminRole
      }
    };

    res.json(responsePayload);
  } catch (error) {
    console.error('Login proxy error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
}


async function signup(req, res) {
  const { username, password, name, role, churchProfileId, departmentId, groupId, signature, churchCreateRequest, customDepartmentName, customGroupName } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ message: 'Missing required user fields' });
  }

  // Enforce email format for new signups
  if (!username.includes('@')) {
    return res.status(400).json({ message: '이메일 형식의 아이디만 가입 가능합니다. (예: example@church.com)' });
  }

  try {
    // 1. Check if email already exists in platform_profiles
    const existingUser = await query.get('SELECT user_id FROM platform_profiles WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ message: '이미 가입된 이메일 주소입니다.' });
    }

    // 2. Sign up user in Supabase Auth
    const { data, error } = await supabasePublic.auth.signUp({
      email: username,
      password,
      options: {
        data: { name: name }
      }
    });

    if (error || !data.user) {
      return res.status(400).json({ message: error ? error.message : 'Signup failed' });
    }

    const userId = data.user.id;
    let projectId = null;
    let signupStatus = 'pending_approval';
    let assignedDeptId = departmentId ? parseInt(departmentId, 10) : null;
    let assignedGroupUuid = groupId || null;

    if (churchCreateRequest) {
      // Flow A: Request new church
      signupStatus = 'pending_church_approval';
      const newChurchId = require('crypto').randomUUID();
      const newProjectId = require('crypto').randomUUID();

      const { churchName, denomination, region, address, managerName, managerEmail } = churchCreateRequest;

      // 2a. Insert pending church profile
      await query.run(`
        INSERT INTO public.church_profiles (
          church_id, project_id, church_name, denomination, region, address, email, manager_name, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [
        newChurchId,
        newProjectId,
        churchName,
        denomination || '',
        region || '',
        address || '',
        managerEmail || username,
        managerName || name
      ]);

      // 2b. Insert pending platform project
      await query.run(`
        INSERT INTO public.platform_projects (
          project_id, org_id, service_id, project_name, description, status, is_active
        ) VALUES (?, 'd7a049e0-06b2-4d26-8809-17be7bf6e491', 'church_think', ?, ?, 'PENDING', FALSE)
      `, [
        newProjectId,
        churchName,
        `${churchName} 스마트 회계 관리 시스템 (승인 대기중)`
      ]);

      // 2c. Create default departments for the new church
      const deptResult = await query.run(`
        INSERT INTO public.church_departments (project_id, name, description, church_profile_id)
        VALUES (?, '재정위원회', '예산 편성 및 회계 감사 위원회', ?)
        RETURNING department_id
      `, [newProjectId, newChurchId]);

      // Generate additional default departments in background/parallel to enrich the new church
      const defaultDepts = ['예배위원회', '선교위원회', '교육위원회', '관리위원회'];
      for (const deptName of defaultDepts) {
        await query.run(`
          INSERT INTO public.church_departments (project_id, name, description, church_profile_id)
          VALUES (?, ?, ?, ?)
        `, [newProjectId, deptName, `${deptName} 업무 통괄`, newChurchId]);
      }

      assignedDeptId = deptResult.id;
      projectId = newProjectId;
    } else {
      // Flow B: Register to existing church
      if (!churchProfileId) {
        return res.status(400).json({ message: '소속 교회를 선택해 주세요.' });
      }

      const church = await query.get('SELECT project_id FROM public.church_profiles WHERE church_id = ?', [churchProfileId]);
      if (!church) {
        return res.status(404).json({ message: '선택한 교회를 찾을 수 없습니다.' });
      }
      projectId = church.project_id;
    }

    // 3. Update platform_profiles status and signup_status
    await query.run(
      'UPDATE public.platform_profiles SET is_active = FALSE, signup_status = ? WHERE user_id = ?',
      [signupStatus, userId]
    );

    // 4. Assign project membership
    await query.run(
      `INSERT INTO public.platform_project_members (project_id, user_id, role_id) VALUES (?, ?, ?)`,
      [projectId, userId, 'user']
    );

    await query.run(
      `INSERT INTO public.platform_role_assignments (user_id, service_id, project_id, role_id) VALUES (?, 'church_think', ?, ?)`,
      [userId, projectId, 'user']
    );

    // 5. Insert church user metadata
    await query.run(`
      INSERT INTO public.church_user_metadata (user_id, project_id, department_id, group_uuid, custom_department_name, custom_group_name, position, signature)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      projectId,
      assignedDeptId,
      assignedGroupUuid,
      customDepartmentName || null,
      customGroupName || null,
      '회원',
      signature || `${name} (인)`
    ]);

    res.status(201).json({ 
      message: churchCreateRequest 
        ? '새 교회 등록 및 가입 신청이 성공적으로 접수되었습니다. 관리자 승인을 기다려 주세요.' 
        : '가입 신청이 성공적으로 접수되었습니다. 관리자 승인을 기다려 주세요.' 
    });
  } catch (error) {
    console.error('Signup proxy error:', error);
    res.status(500).json({ message: error.message || 'Database error during signup.' });
  }
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호를 모두 입력해 주세요.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: '새 비밀번호는 최소 8자 이상이어야 합니다.' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ message: '새 비밀번호는 현재 비밀번호와 다르게 설정해야 합니다.' });
  }

  const userId = req.user.userId;
  const username = req.user.username;
  const email = username.includes('@') ? username : `${username}@boozathink.com`;

  console.log(`[PASSWORD CHANGE ATTEMPT] User: ${userId}, Email: ${email}`);

  try {
    // 1. Verify current password
    const { data: signInData, error: signInError } = await supabasePublic.auth.signInWithPassword({
      email,
      password: currentPassword
    });

    if (signInError || !signInData.user) {
      console.error(`[PASSWORD CHANGE FAILED] Current password verification failed for ${userId}:`, signInError?.message);
      return res.status(400).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
    }

    // 2. Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (updateError) {
      console.error(`[PASSWORD CHANGE ERROR] Failed to update password for ${userId}:`, updateError.message);
      return res.status(500).json({ message: '비밀번호 변경 중 오류가 발생했습니다.' });
    }

    console.log(`[PASSWORD CHANGE SUCCESS] Password updated for User: ${userId}`);
    res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    console.error(`[PASSWORD CHANGE SYSTEM ERROR] System error for User: ${userId}:`, error.message);
    res.status(500).json({ message: '비밀번호 변경 중 시스템 오류가 발생했습니다.' });
  }
}

module.exports = {
  authenticateToken,
  requireRole,
  login,
  signup,
  changePassword
};
