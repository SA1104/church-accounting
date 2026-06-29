const { query } = require('../../core/db');

// Helper to check if a user is an admin
function isUserAdmin(req) {
  const email = req.user.email || '';
  const username = req.user.username || '';
  const platformRole = req.user.roles?.platform || '';
  const accountingRole = req.user.roles?.accounting || '';
  
  return (
    username === 'admin' ||
    email === 'admin@boozathink.com' ||
    platformRole === 'SYSTEM_ADMIN' ||
    accountingRole === 'SYSTEM_ADMIN' ||
    req.user.isAdmin === true
  );
}

// Resolve user organization context scope bounds
async function resolveUserScope(req) {
  const userId = req.user.userId || req.user.id;
  const projectId = req.user.projectId;
  const role = req.user.roles?.accounting || 'USER';
  const isAdmin = isUserAdmin(req);
  const isAuditor = role === 'AUDITOR';

  // 1. Resolve church profile UUID from active project
  let churchId = null;
  if (projectId) {
    const profile = await query.get('SELECT church_id FROM public.church_profiles WHERE project_id = ? LIMIT 1', [projectId]);
    if (profile) churchId = profile.church_id;
  }

  // 2. Admin & Auditor have full global access
  if (isAdmin || isAuditor) {
    return {
      churchId,
      allowedCommitteeIds: [], // Empty means unrestricted
      allowedGroupIds: [],
      canViewChurchWide: true,
      canViewAllCommittees: true,
      canManageOrganizations: isAdmin,
      role: isAdmin ? 'SYSTEM_ADMIN' : 'AUDITOR'
    };
  }

  // 3. Query all context-specific roles from church_user_contexts
  const contexts = await query.all(
    'SELECT department_id, role_id FROM public.church_user_contexts WHERE user_id = ?',
    [userId]
  );

  const allowedCommitteeIds = [];
  const allowedGroupIds = [];
  let isCommitteeChair = role === 'FINANCE_MANAGER';

  // Check if they are mapped to specific contexts in church_user_contexts
  for (const ctx of contexts) {
    if (ctx.role_id === 'FINANCE_MANAGER') {
      allowedCommitteeIds.push(ctx.department_id);
      isCommitteeChair = true;
    } else {
      allowedGroupIds.push(ctx.department_id);
    }
  }

  // Fallback to primary metadata if no custom contexts exist
  const meta = await query.get(
    'SELECT department_id, position FROM public.church_user_metadata WHERE user_id = ?',
    [userId]
  );

  if (meta && meta.department_id) {
    const primaryDeptId = meta.department_id;
    const dept = await query.get(
      'SELECT parent_id FROM public.church_departments WHERE department_id = ?',
      [primaryDeptId]
    );

    if (dept) {
      const primaryCommitteeId = dept.parent_id;

      if (isCommitteeChair) {
        if (primaryCommitteeId && !allowedCommitteeIds.includes(primaryCommitteeId)) {
          allowedCommitteeIds.push(primaryCommitteeId);
        }
      } else {
        if (!allowedGroupIds.includes(primaryDeptId)) {
          allowedGroupIds.push(primaryDeptId);
        }
        if (primaryCommitteeId && !allowedCommitteeIds.includes(primaryCommitteeId)) {
          allowedCommitteeIds.push(primaryCommitteeId);
        }
      }
    }
  }

  // If a Committee Chair is authorized, retrieve all child groups belonging to their allowed committees
  if (isCommitteeChair && allowedCommitteeIds.length > 0) {
    const childGroups = await query.all(
      `SELECT department_id FROM public.church_departments WHERE parent_id IN (${allowedCommitteeIds.map(() => '?').join(',')})`,
      allowedCommitteeIds
    );
    childGroups.forEach(g => {
      if (!allowedGroupIds.includes(g.department_id)) {
        allowedGroupIds.push(g.department_id);
      }
    });
  }

  return {
    churchId,
    allowedCommitteeIds,
    allowedGroupIds,
    canViewChurchWide: false,
    canViewAllCommittees: false,
    canManageOrganizations: false,
    role: isCommitteeChair ? 'FINANCE_MANAGER' : (role === 'DEPARTMENT_HEAD' ? 'DEPARTMENT_HEAD' : 'USER')
  };
}

// Middleware to enforce context validation on accounting requests
async function enforceContextSecurity(req, res, next) {
  try {
    const scope = await resolveUserScope(req);
    req.contextScope = scope;

    const requestCommitteeId = req.query.committeeId || req.body.committeeId;
    const requestGroupId = req.query.groupId || req.body.groupId || req.query.group || req.body.group;

    // Check Committee constraints
    if (requestCommitteeId) {
      const committeeIdInt = parseInt(requestCommitteeId, 10);
      if (!scope.canViewAllCommittees && !scope.allowedCommitteeIds.includes(committeeIdInt)) {
        return res.status(403).json({
          error: 'FORBIDDEN_CONTEXT',
          message: '해당 조직 범위의 데이터를 조회할 권한이 없습니다. (Committee Access Denied)'
        });
      }
    }

    // Check Group constraints
    if (requestGroupId) {
      const groupIdInt = parseInt(requestGroupId, 10);
      if (!scope.canViewChurchWide && !scope.allowedGroupIds.includes(groupIdInt)) {
        return res.status(403).json({
          error: 'FORBIDDEN_CONTEXT',
          message: '해당 조직 범위의 데이터를 조회할 권한이 없습니다. (Group Access Denied)'
        });
      }
    }

    next();
  } catch (err) {
    console.error('Context security middleware error:', err);
    res.status(500).json({ error: 'INTERNAL_SECURITY_ERROR', message: 'Context validation failed.' });
  }
}

module.exports = {
  resolveUserScope,
  enforceContextSecurity,
  isUserAdmin
};
