global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const { query } = require('./db');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// Initialize Supabase Admin Client to bypass RLS for backend operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
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
    const { data: { user }, error } = await supabase.auth.getUser(token);

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
      roles[row.service_id] = row.role_id === 'super_admin' ? 'SYSTEM_ADMIN' : 
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

    // Bind legacy format context
    req.user = {
      userId: user.id, // Now UUID String
      username: profile.username,
      name: profile.display_name,
      projectId: projectId,
      roles: {
        platform: roles['platform'] || (roles['church_think'] === 'SYSTEM_ADMIN' ? 'SYSTEM_ADMIN' : 'USER'),
        accounting: roles['church_think'] || 'USER'
      },
      accounting: accountingMeta ? { ...accountingMeta, projectId } : null
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

  try {
    // In Supabase, auth is email-based. Convert username to system email format
    const email = `${username}@boozathink.com`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      return res.status(400).json({ message: error ? error.message : 'Invalid credentials' });
    }

    // Resolve user's profile and roles
    const profile = await query.get('SELECT display_name, is_active FROM platform_profiles WHERE user_id = ?', [data.user.id]);
    if (!profile || !profile.is_active) {
      return res.status(400).json({ message: 'Profile is inactive' });
    }

    const rolesRows = await query.all('SELECT service_id, role_id FROM platform_role_assignments WHERE user_id = ?', [data.user.id]);
    const roles = {};
    rolesRows.forEach(row => {
      roles[row.service_id] = row.role_id === 'super_admin' ? 'SYSTEM_ADMIN' : 
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

    const responsePayload = {
      token: data.session.access_token,
      user: {
        userId: data.user.id,
        username,
        name: profile.display_name,
        roles: {
          platform: roles['platform'] || (roles['church_think'] === 'SYSTEM_ADMIN' ? 'SYSTEM_ADMIN' : 'USER'),
          accounting: roles['church_think'] || 'USER'
        },
        accounting: accountingMeta
      }
    };

    res.json(responsePayload);
  } catch (error) {
    console.error('Login proxy error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
}

async function signup(req, res) {
  const { username, password, name, email, serviceId, role, accounting } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ message: 'Missing required user fields' });
  }

  try {
    const systemEmail = `${username}@boozathink.com`;

    // Sign up user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: systemEmail,
      password,
      options: {
        data: { name: name }
      }
    });

    if (error || !data.user) {
      return res.status(400).json({ message: error ? error.message : 'Signup failed' });
    }

    const userId = data.user.id;
    const legacyServiceId = serviceId === 'accounting' ? 'church_think' : serviceId;

    // Assign service membership
    if (legacyServiceId) {
      await query.run(
        'INSERT INTO platform_service_memberships (user_id, service_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
        [userId, legacyServiceId]
      );

      // Map role to platform roles
      const targetRole = role === 'SYSTEM_ADMIN' ? 'super_admin' :
                         (role === 'AUDITOR' ? 'service_admin' : 'user');

      await query.run(
        'INSERT INTO platform_role_assignments (user_id, service_id, role_id) VALUES (?, ?, ?) ON CONFLICT DO NOTHING',
        [userId, legacyServiceId, targetRole]
      );

      // Handle Church Think Metadata hook
      if (legacyServiceId === 'church_think' && accounting) {
        const { group_id, position, signature } = accounting;
        await query.run(`
          INSERT INTO church_user_metadata (user_id, project_id, department_id, position, signature)
          VALUES (
            ?, 
            (SELECT project_id FROM platform_projects WHERE service_id = 'church_think' LIMIT 1),
            ?, 
            ?, 
            ?
          ) ON CONFLICT DO NOTHING
        `, [
          userId,
          group_id ? parseInt(group_id, 10) : null,
          position || '기타',
          signature || `${name} (${position || '기타'}) (인)`
        ]);
      }
    }

    res.status(201).json({ message: 'Signup request submitted successfully. Awaiting administrator approval.' });
  } catch (error) {
    console.error('Signup proxy error:', error);
    res.status(500).json({ message: 'Database error during signup.' });
  }
}

module.exports = {
  authenticateToken,
  requireRole,
  login,
  signup
};
