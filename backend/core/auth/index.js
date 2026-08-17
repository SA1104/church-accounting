global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const { query } = require('../db');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const SUPABASE_PUBLIC_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || 'placeholder-service-role-key';

// Initialize Supabase clients Client to bypass RLS for backend operations
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
const supabasePublic = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY || 'placeholder-anon-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// --- Email Normalization ---
function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

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
    const isMockMode = SUPABASE_URL.includes('your-supabase-project') || SUPABASE_URL.includes('booza-think');
    if (isMockMode) {
      let mockUsername = 'ullalla11';
      if (token === 'admin-token' || token.startsWith('admin-')) {
        mockUsername = 'admin';
      } else if (token === 'finance-token' || token.startsWith('finance-')) {
        mockUsername = 'finance';
      } else if (token === 'accountant-token' || token.startsWith('accountant-')) {
        mockUsername = 'accountant';
      } else if (token === 'depthead-token' || token.startsWith('depthead-')) {
        mockUsername = 'depthead';
      } else if (token === 'auditor-token' || token.startsWith('auditor-')) {
        mockUsername = 'auditor';
      } else if (token === 'user-token' || token.startsWith('ullalla11-')) {
        mockUsername = 'ullalla11';
      } else if (token.endsWith('-token')) {
        mockUsername = token.slice(0, -6).replace('-uuid-placeholder', '');
      } else {
        mockUsername = token;
      }

      // Query database platform_profiles to get the real user ID and profile info
      let profile = await query.get(
        'SELECT user_id, username, display_name, phone, is_active, user_status FROM platform_profiles WHERE username = ? OR user_id = ? LIMIT 1',
        [mockUsername, mockUsername]
      );
      
      if (!profile) {
        profile = {
          user_id: `${mockUsername}-uuid-placeholder`,
          username: mockUsername,
          display_name: mockUsername === 'admin' ? '관리자' : (mockUsername === 'finance' ? '이재정' : '일반회원'),
          is_active: true,
          user_status: 'ACTIVE'
        };
      }

      const userStatus = profile.user_status || 'ACTIVE';
      if (!profile.is_active || ['BLOCKED', 'WITHDRAWN'].includes(userStatus)) {
        return res.status(403).json({ message: 'User account is blocked or withdrawn.' });
      }

      // Resolve assignment context and projectId
      const assignmentId = req.headers['x-context-assignment-id'];
      let projectId = '8a510c4f-c006-4442-8924-f3c75ab73cf6';
      let activeContext = null;

      if (assignmentId) {
        const assignment = await query.get(
          "SELECT project_id, committee_id, group_id, position_id, role_code, status FROM public.church_user_assignments WHERE id = ? AND user_id = ? AND is_active = TRUE",
          [assignmentId, profile.user_id]
        );
        if (assignment && assignment.status === 'approved') {
          projectId = assignment.project_id;
          activeContext = {
            assignmentId: assignment.id,
            projectId: projectId,
            committeeId: assignment.committee_id,
            groupId: assignment.group_id,
            positionId: assignment.position_id,
            roleCode: assignment.role_code
          };
        }
      }

      if (!activeContext) {
        const primary = await query.get(
          "SELECT id, project_id, committee_id, group_id, position_id, role_code FROM public.church_user_assignments WHERE user_id = ? AND is_primary = TRUE AND is_active = TRUE AND status = 'approved' LIMIT 1",
          [profile.user_id]
        );
        if (primary) {
          projectId = primary.project_id;
          activeContext = {
            assignmentId: primary.id,
            projectId: projectId,
            committeeId: primary.committee_id,
            groupId: primary.group_id,
            positionId: primary.position_id,
            roleCode: primary.role_code
          };
        }
      }

      // If no approved assignment, check approved membership
      let hasApprovedMembership = false;
      const membership = await query.get(`
        SELECT m.membership_id, m.project_id, p.project_name as church_name
        FROM public.platform_memberships m
        JOIN public.platform_projects p ON m.project_id = p.project_id
        WHERE m.user_id = ? AND m.status = 'approved' AND m.capability = 'church' LIMIT 1
      `, [profile.user_id]);

      if (membership) {
        hasApprovedMembership = true;
        if (!activeContext) {
          projectId = membership.project_id;
        }
      }

      // Resolve roles mapped strictly to current project
      const rolesRows = await query.all(
        'SELECT service_id, role_id FROM platform_role_assignments WHERE user_id = ? AND project_id = ?',
        [profile.user_id, projectId]
      );
      const roles = {};
      rolesRows.forEach(row => {
        const isSystemAdminRole = row.role_id === 'super_admin' || row.role_id === 'admin' || row.role_id === 'project_admin' || row.role_id === 'SYSTEM_ADMIN';
        roles[row.service_id] = isSystemAdminRole ? 'SYSTEM_ADMIN' : 
                                (row.role_id === 'service_admin' ? 'AUDITOR' : row.role_id);
      });

      const isSystemAdminRole = roles['church_think'] === 'SYSTEM_ADMIN';

      req.user = {
        userId: profile.user_id,
        id: profile.user_id,
        email: `${profile.username}@boozathink.com`,
        username: profile.username,
        name: profile.display_name,
        projectId: projectId,
        roles: {
          platform: roles['platform'] || 'USER',
          accounting: isSystemAdminRole ? 'SYSTEM_ADMIN' : (activeContext ? activeContext.roleCode : 'USER'),
          church_think: isSystemAdminRole ? 'super_admin' : (activeContext ? activeContext.roleCode : 'user')
        },
        accounting: {
          role: isSystemAdminRole ? 'SYSTEM_ADMIN' : (activeContext ? activeContext.roleCode : 'USER'),
          organizationName: membership ? membership.church_name : '신길교회',
          departmentName: null,
          position: activeContext ? '부서원' : '회원',
          groupId: activeContext ? activeContext.groupId : null,
          groupName: '소속 부서 없음',
          projectId: projectId,
          activeContext: activeContext,
          permissions: isSystemAdminRole ? [
            "settings:read",
            "settings:write",
            "users:manage",
            "closing:manage"
          ] : []
        },
        isAdmin: isSystemAdminRole,
        hasApprovedMembership: hasApprovedMembership,
        position: '회원',
        groupName: '소속 부서 없음'
      };

      if (activeContext) {
        req.user.accounting.role = activeContext.roleCode;
        req.user.accounting.groupId = activeContext.groupId || activeContext.committeeId;
        req.user.roles['church_think'] = activeContext.roleCode;
        req.user.roles['accounting'] = activeContext.roleCode;

        if (activeContext.groupId) {
          const dept = await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [activeContext.groupId]);
          if (dept) {
            req.user.accounting.groupName = dept.name;
            req.user.groupName = dept.name;
          }
        }
        if (activeContext.committeeId) {
          const comm = await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [activeContext.committeeId]);
          if (comm) req.user.accounting.departmentName = comm.name;
        }
        if (activeContext.positionId) {
          const pos = await query.get("SELECT name FROM public.church_positions WHERE position_id = ?", [activeContext.positionId]);
          if (pos) {
            req.user.accounting.position = pos.name;
            req.user.position = pos.name;
          }
        }
      }

      console.log('[AUTH MOCK LOG] user:', req.user.username, 'isAdmin:', req.user.isAdmin, 'roles:', req.user.roles);
      return next();
    }

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Resolve user's platform profile
    const profile = await query.get(
      'SELECT username, display_name, phone, avatar_url, is_active, user_status FROM platform_profiles WHERE user_id = ?',
      [user.id]
    );

    const userStatus = profile?.user_status || 'ACTIVE';
    if (!profile || !profile.is_active || ['BLOCKED', 'WITHDRAWN'].includes(userStatus)) {
      return res.status(403).json({ message: 'User profile is inactive, blocked, or not found' });
    }

    // Resolve active context and projectId
    let assignmentId = req.headers['x-context-assignment-id'];
    const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
    
    if (assignmentId && !isUuid(assignmentId)) {
      console.warn('[Auth] Ignoring invalid context assignment id:', assignmentId);
      assignmentId = null;
    }

    let projectId = '8a510c4f-c006-4442-8924-f3c75ab73cf6';
    let activeContext = null;

    if (assignmentId) {
      const assignment = await query.get(
        "SELECT project_id, committee_id, group_id, position_id, role_code, status FROM public.church_user_assignments WHERE id = ? AND user_id = ? AND is_active = TRUE",
        [assignmentId, user.id]
      );
      if (assignment && assignment.status === 'approved') {
        projectId = assignment.project_id;
        activeContext = {
          assignmentId: assignment.id,
          projectId: projectId,
          committeeId: assignment.committee_id,
          groupId: assignment.group_id,
          positionId: assignment.position_id,
          roleCode: assignment.role_code
        };
      }
    }

    if (!activeContext) {
      const primary = await query.get(
        "SELECT id, project_id, committee_id, group_id, position_id, role_code FROM public.church_user_assignments WHERE user_id = ? AND is_primary = TRUE AND is_active = TRUE AND status = 'approved' LIMIT 1",
        [user.id]
      );
      if (primary) {
        projectId = primary.project_id;
        activeContext = {
          assignmentId: primary.id,
          projectId: projectId,
          committeeId: primary.committee_id,
          groupId: primary.group_id,
          positionId: primary.position_id,
          roleCode: primary.role_code
        };
      }
    }

    // If no approved assignment, check approved membership
    let hasApprovedMembership = false;
    const membership = await query.get(`
      SELECT m.membership_id, m.project_id, p.project_name as church_name
      FROM public.platform_memberships m
      JOIN public.platform_projects p ON m.project_id = p.project_id
      WHERE m.user_id = ? AND m.status = 'approved' AND m.capability = 'church' LIMIT 1
    `, [user.id]);

    if (membership) {
      hasApprovedMembership = true;
      if (!activeContext) {
        projectId = membership.project_id;
      }
    }

    // Resolve roles mapped strictly to current project
    const rolesRows = await query.all(
      'SELECT service_id, role_id FROM platform_role_assignments WHERE user_id = ? AND project_id = ?',
      [user.id, projectId]
    );
    const roles = {};
    rolesRows.forEach(row => {
      const isSystemAdminRole = row.role_id === 'super_admin' || row.role_id === 'admin' || row.role_id === 'project_admin' || row.role_id === 'SYSTEM_ADMIN';
      roles[row.service_id] = isSystemAdminRole ? 'SYSTEM_ADMIN' : 
                              (row.role_id === 'service_admin' ? 'AUDITOR' : row.role_id);
    });

    const isSystemAdminRole = roles['church_think'] === 'SYSTEM_ADMIN';

    const email = user.email;

    req.user = {
      userId: user.id,
      id: user.id,
      email: email,
      username: profile.username,
      name: profile.display_name,
      projectId: projectId,
      roles: {
        platform: roles['platform'] || 'USER',
        accounting: isSystemAdminRole ? 'SYSTEM_ADMIN' : (activeContext ? activeContext.roleCode : 'USER'),
        church_think: isSystemAdminRole ? 'super_admin' : (activeContext ? activeContext.roleCode : 'user')
      },
      accounting: {
        role: isSystemAdminRole ? 'SYSTEM_ADMIN' : (activeContext ? activeContext.roleCode : 'USER'),
        organizationName: membership ? membership.church_name : '신길교회',
        departmentName: null,
        position: activeContext ? '부서원' : '회원',
        groupId: activeContext ? activeContext.groupId : null,
        groupName: '소속 부서 없음',
        projectId: projectId,
        activeContext: activeContext,
        permissions: isSystemAdminRole ? [
          "settings:read",
          "settings:write",
          "users:manage",
          "closing:manage"
        ] : []
      },
      isAdmin: isSystemAdminRole,
      hasApprovedMembership: hasApprovedMembership,
      position: '회원',
      groupName: '소속 부서 없음'
    };

    if (activeContext) {
      req.user.accounting.role = activeContext.roleCode;
      req.user.accounting.groupId = activeContext.groupId || activeContext.committeeId;
      req.user.roles['church_think'] = activeContext.roleCode;
      req.user.roles['accounting'] = activeContext.roleCode;

      if (activeContext.groupId) {
        const dept = await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [activeContext.groupId]);
        if (dept) {
          req.user.accounting.groupName = dept.name;
          req.user.groupName = dept.name;
        }
      }
      if (activeContext.committeeId) {
        const comm = await query.get("SELECT name FROM public.church_departments WHERE department_id = ?", [activeContext.committeeId]);
        if (comm) req.user.accounting.departmentName = comm.name;
      }
      if (activeContext.positionId) {
        const pos = await query.get("SELECT name FROM public.church_positions WHERE position_id = ?", [activeContext.positionId]);
        if (pos) {
          req.user.accounting.position = pos.name;
          req.user.position = pos.name;
        }
      }
    }

    next();
  } catch (err) {
    console.error('[AUTH ERROR] Token authentication error:', err);
    const responsePayload = {
      message: `[Auth Error] ${err.message}`
    };
    responsePayload.error = err.message;
    responsePayload.stack = err.stack;
    return res.status(500).json(responsePayload);
  }
}

function requireRole(allowedRoles, serviceId = 'platform') {
  return (req, res, next) => {
    const accountingRole = req.user && req.user.accounting ? req.user.accounting.role : 'undefined';
    console.log(`[AUTH requireRole] User: ${req.user ? req.user.username : 'undefined'}, ServiceId: ${serviceId}, Roles:`, req.user ? req.user.roles : 'undefined', `AllowedRoles:`, allowedRoles, `accounting.role:`, accountingRole, `isAdmin:`, req.user ? req.user.isAdmin : false);
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

    // Check accounting.role for accounting service requests
    if (serviceId === 'accounting' && accountingRole) {
      const normalizedAccountingRole = accountingRole === 'super_admin' || accountingRole === 'admin' ? 'SYSTEM_ADMIN' : accountingRole;
      if (allowedRoles.includes(normalizedAccountingRole)) {
        return next();
      }
    }

    const userRole = req.user.roles[legacyServiceId];
    if (userRole && allowedRoles.includes(userRole)) {
      return next();
    }

    // Map system role string compatibility
    const systemAdminEquiv = allowedRoles.includes('SYSTEM_ADMIN') && (userRole === 'super_admin' || userRole === 'admin');
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
    return res.status(400).json({ success: false, code: 'INVALID_CREDENTIALS', message: '아이디와 비밀번호를 모두 입력해 주세요.' });
  }

  // Determine email format
  const loginId = String(username).trim();
  const email = loginId.includes('@') ? normalizeEmail(loginId) : `${normalizeEmail(loginId)}@boozathink.com`;
  console.log('[AUTH LOGIN REQUEST]', { email, bodyKeys: Object.keys(req.body) });

  try {
    const isMockMode = SUPABASE_URL.includes('your-supabase-project') || SUPABASE_URL.includes('booza-think');
    if (isMockMode) {
      const isPasswordValid = password === 'password123' || 
                              password === 'admin123' || 
                              password === 'acc123' || 
                              password === 'head123' || 
                              password === 'fin123' || 
                              password === 'aud123' ||
                              password === `${username}123`;
      if (isPasswordValid) {
        const usernameClean = username.split('@')[0];
        const mockToken = `${usernameClean}-token`;
        const profile = await query.get('SELECT user_id, display_name FROM platform_profiles WHERE username = ? OR username = ? LIMIT 1', [usernameClean, username]);
        const userId = profile ? profile.user_id : `${usernameClean}-uuid-placeholder`;
        const displayName = profile ? profile.display_name : (usernameClean === 'admin' ? '관리자' : (usernameClean === 'finance' ? '이재정' : '일반회원'));

        return res.json({
          token: mockToken,
          user: {
            id: userId,
            email: email,
            user_metadata: { name: displayName }
          }
        });
      } else {
        return res.status(400).json({ success: false, code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
    }

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
      
      let errorCode = 'INVALID_CREDENTIALS';
      let errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
      
      if (error && error.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('email not confirmed')) {
          errorCode = 'EMAIL_NOT_CONFIRMED';
          errorMessage = '이메일 인증이 완료되지 않았습니다.';
        } else if (msg.includes('invalid login credentials')) {
          errorCode = 'INVALID_CREDENTIALS';
        } else if (error.status === 429 || msg.includes('too many requests') || msg.includes('rate limit')) {
          errorCode = 'TOO_MANY_ATTEMPTS';
          errorMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
        }
      }
      return res.status(400).json({ success: false, code: errorCode, message: errorMessage });
    }

    // Resolve user's profile (including database username) and roles
    const profile = await query.get('SELECT username, display_name, is_active FROM platform_profiles WHERE user_id = ?', [data.user.id]);
    if (!profile) {
      console.error('[AUTH LOGIN ERROR] Profile not found for user:', data.user.id);
      return res.status(400).json({ success: false, code: 'PROFILE_NOT_FOUND', message: '프로필 정보가 존재하지 않습니다.' });
    }
    if (!profile.is_active) {
      return res.status(400).json({ success: false, code: 'ACCOUNT_INACTIVE', message: '비활성화된 계정입니다. 관리자에게 문의하세요.' });
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
        role: isSystemAdminRole ? 'SYSTEM_ADMIN' : (roles['church_think'] || 'USER'),
        roles: {
          platform: roles['platform'] || (roles['church_think'] === 'SYSTEM_ADMIN' ? 'SYSTEM_ADMIN' : 'USER'),
          accounting: roles['church_think'] || 'USER',
          church_think: roles['church_think'] === 'SYSTEM_ADMIN' ? 'super_admin' : (roles['church_think'] || 'user')
        },
        accounting: {
          role: isSystemAdminRole ? 'SYSTEM_ADMIN' : (roles['church_think'] || 'USER'),
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
    res.status(500).json({ success: false, code: 'INTERNAL_AUTH_ERROR', message: '로그인 처리 중 서버 오류가 발생했습니다.' });
  }
}

async function signup(req, res) {
  const { username, password, name, email, phone } = req.body;

  if (!username || !password || !name || !email) {
    return res.status(400).json({ success: false, message: '필수 가입 정보(아이디, 비밀번호, 이름, 이메일)가 누락되었습니다.' });
  }

  // Enforce email format for email
  if (!email.includes('@')) {
    return res.status(400).json({ success: false, message: '올바른 이메일 형식을 입력해 주세요.' });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    // 1. Check if email or username already exists in platform_profiles
    const existingUser = await query.get(
      'SELECT user_id FROM platform_profiles WHERE username = ? OR email = ?',
      [username, normalizedEmail]
    );
    if (existingUser) {
      return res.status(400).json({ success: false, message: '이미 가입된 아이디 또는 이메일 주소입니다.' });
    }

    // 2. Sign up user in Supabase Auth / Mock Auth
    let userId;
    let needsEmailConfirmation = false;
    
    const isMockMode = SUPABASE_URL.includes('your-supabase-project') || SUPABASE_URL.includes('booza-think');
    if (isMockMode) {
      userId = `mock-user-uuid-${Math.random().toString(36).substring(7)}`;
      // Insert profile record directly since there is no Supabase trigger in mock mode
      await query.run(`
        INSERT INTO public.platform_profiles (user_id, username, email, display_name, phone, signup_status, is_active)
        VALUES (?, ?, ?, ?, ?, 'approved', TRUE)
      `, [userId, username, normalizedEmail, name, phone || '']);
    } else {
      const { data, error } = await supabasePublic.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { name: name, username: username, phone: phone || '' }
        }
      });

      if (error || !data.user) {
        return res.status(400).json({ success: false, message: error ? error.message : 'Signup failed' });
      }
      
      userId = data.user.id;
      
      // If session is null, email confirmation is required
      if (!data.session) {
        needsEmailConfirmation = true;
      }

      // Ensure platform profile is written / active
      try {
        await query.run(`
        INSERT INTO public.platform_profiles (user_id, username, email, display_name, phone, signup_status, is_active)
        VALUES (?, ?, ?, ?, ?, 'approved', TRUE)
        ON CONFLICT (user_id) DO UPDATE SET
          username = EXCLUDED.username,
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          phone = EXCLUDED.phone,
          is_active = TRUE
      `, [userId, username, normalizedEmail, name, phone || '']);
      } catch (e) {
        console.error('[AUTH SIGNUP ERROR] Failed to insert platform profile:', e);
        // Rollback Auth user creation
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return res.status(500).json({ success: false, message: '프로필 생성 중 오류가 발생하여 회원가입이 취소되었습니다.' });
      }
    }

    res.status(201).json({ 
      success: true,
      needsEmailConfirmation,
      message: needsEmailConfirmation 
        ? '인증 메일이 발송되었습니다. 메일함에서 인증을 완료한 후 로그인해 주세요.'
        : '회원가입이 완료되었습니다. 로그인 후 교회 가입 또는 생체 지문 등록을 진행해 주세요.',
      user: {
        id: userId,
        username,
        name,
        email: normalizedEmail
      }
    });
  } catch (error) {
    console.error('Signup proxy error:', error);
    res.status(500).json({ success: false, message: error.message || 'Database error during signup.' });
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



function resolvePasswordResetRedirectUrl() {
  try {
    const candidate = process.env.PASSWORD_RESET_REDIRECT_URL;

    const url = candidate
      ? new URL(candidate)
      : process.env.FRONTEND_URL
        ? new URL('/reset-password', process.env.FRONTEND_URL)
        : null;

    if (!url) return null;
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    if (url.pathname !== '/reset-password') return null;
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      return null;
    }

    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
async function forgotPassword(req, res) {
  const email = req.body?.email;
  
  if (typeof email !== 'string') {
    return res.status(400).json({ success: false, message: '이메일을 입력해 주세요.' });
  }

  const cleanEmail = email.trim();

  if (!cleanEmail || cleanEmail.length > 254 || !BASIC_EMAIL_PATTERN.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: '올바른 이메일 형식을 입력해 주세요.' });
  }

  if (!supabaseRecovery) {
    return res.status(500).json({ success: false, message: '서버 인증 설정 오류가 발생했습니다.' });
  }

  const redirectUrl = resolvePasswordResetRedirectUrl();
  if (!redirectUrl) {
    return res.status(500).json({ success: false, message: '서버 리디렉션 설정 오류가 발생했습니다.' });
  }

  const normalizedEmail = normalizeEmail(cleanEmail);

  try {
    const { error } = await supabaseRecovery.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: redirectUrl,
    });
    
    if (error) {
      console.warn('[AUTH FORGOT PASSWORD UPSTREAM ERROR]', {
        code: typeof error.code === 'string' ? error.code : undefined,
        status: Number.isInteger(error.status) ? error.status : undefined
      });

      return res.status(503).json({
        success: false,
        message: '현재 비밀번호 재설정 메일 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: '입력하신 이메일로 가입된 계정이 있다면 비밀번호 재설정 안내를 발송했습니다.'
    });
  } catch (error) {
    console.warn('[AUTH FORGOT PASSWORD UPSTREAM EXCEPTION]', {
      code: typeof error?.code === 'string' ? error.code : undefined,
      status: Number.isInteger(error?.status) ? error.status : undefined
    });

    return res.status(503).json({
      success: false,
      message: '현재 비밀번호 재설정 메일 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.'
    });
  }
}

const getResendRedirectUrl = () => {
  try {
    const candidate = process.env.EMAIL_CONFIRM_REDIRECT_URL;
    const url = candidate
      ? new URL(candidate)
      : process.env.FRONTEND_URL
        ? new URL('/login', process.env.FRONTEND_URL)
        : null;

    if (!url) return null;
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    if (url.pathname !== '/login') return null;
    
    if (process.env.NODE_ENV === 'production' || process.env.MOCK_PROD_REDIRECT === '1') {
      if (url.protocol !== 'https:') return null;
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return null;
    }

    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
};

const createResendConfirmationHandler = ({ authClient, logger, redirectResolver }) => async (req, res) => {
  const email = req.body?.email;
  
  if (typeof email !== 'string') {
    return res.status(400).json({ success: false, message: '이메일 형식을 확인해 주세요.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || cleanEmail.length > 254 || !BASIC_EMAIL_PATTERN.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: '이메일 형식을 확인해 주세요.' });
  }

  const redirectUrl = redirectResolver();
  if (!redirectUrl) {
    return res.status(503).json({ success: false, message: '서버 리디렉션 설정 오류가 발생했습니다.' });
  }

  const normalizedEmail = normalizeEmail(cleanEmail);
  const maskedEmail = normalizedEmail.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(1, Math.min(b.length, 5))) + c);
  
  if (logger) {
    logger(`[AUTH] Resend confirmation requested for ${maskedEmail}`);
  }

  if (!authClient) {
    return res.status(503).json({ success: false, message: '현재 인증 서비스를 이용할 수 없습니다.' });
  }

  try {
    const { error } = await authClient.resend({
      type: 'signup',
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) {
      if (error.status === 429) {
        return res.status(429).json({
          success: false,
          message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'
        });
      }
      if (error.status >= 500) {
        return res.status(503).json({
          success: false,
          message: '서버 연동 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
        });
      }
      
      if (logger) {
        logger('[AUTH RESEND CONFIRMATION UPSTREAM ERROR]', {
          code: typeof error.code === 'string' ? error.code : undefined,
          status: Number.isInteger(error.status) ? error.status : undefined
        });
      }
      // We don't return error to user if account not found/already verified, we return 200
    }
    
    return res.status(200).json({
      success: true,
      message: '재발송이 가능한 계정이라면 가입 확인 메일을 보내드렸습니다. 메일함과 스팸함을 확인해 주세요.'
    });
  } catch (error) {
    if (logger) {
      logger('[AUTH RESEND CONFIRMATION UPSTREAM EXCEPTION]', {
        code: typeof error?.code === 'string' ? error.code : undefined,
        status: Number.isInteger(error?.status) ? error.status : undefined
      });
    }

    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    });
  }
};

module.exports = {
  supabasePublic,
  getResendRedirectUrl,
  authenticateToken,
  requireRole,
  login,
  signup,
  changePassword,
  forgotPassword,
  createResendConfirmationHandler,
  normalizeEmail
};
