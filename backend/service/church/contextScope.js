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

// Resolve user organization context scope bounds based on Multi-Assignment activeContext
async function resolveUserScope(req) {
  const userId = req.user.userId || req.user.id;
  const projectId = req.user.projectId;
  const isAdmin = isUserAdmin(req);
  const activeRole = req.user.accounting?.role || req.user.roles?.accounting || 'USER';
  const isAuditor = activeRole === 'AUDITOR';

  let churchId = null;
  if (projectId) {
    const profile = await query.get('SELECT church_id FROM public.church_profiles WHERE project_id = ? LIMIT 1', [projectId]);
    if (profile) churchId = profile.church_id;
  }

  if (isAdmin || isAuditor) {
    return {
      churchId,
      allowedCommitteeIds: [], 
      allowedGroupIds: [],
      canViewChurchWide: true,
      canViewAllCommittees: true,
      canManageOrganizations: isAdmin,
      role: isAdmin ? 'SYSTEM_ADMIN' : 'AUDITOR'
    };
  }

  const activeContext = req.user.accounting?.activeContext;
  if (!activeContext) {
    return {
      churchId,
      allowedCommitteeIds: [],
      allowedGroupIds: [],
      canViewChurchWide: false,
      canViewAllCommittees: false,
      canManageOrganizations: false,
      role: 'USER'
    };
  }

  const allowedCommitteeIds = [activeContext.committeeId];
  const allowedGroupIds = [];
  const role = activeContext.roleCode;

  if (role === 'COMMITTEE_CHAIR') {
    const childGroups = await query.all(
      "SELECT department_id FROM public.church_departments WHERE parent_id = ? AND project_id = ?",
      [activeContext.committeeId, projectId]
    );
    childGroups.forEach(g => {
      allowedGroupIds.push(g.department_id);
    });
  } else if (activeContext.groupId) {
    allowedGroupIds.push(activeContext.groupId);
  }

  return {
    churchId,
    allowedCommitteeIds,
    allowedGroupIds,
    canViewChurchWide: false,
    canViewAllCommittees: false,
    canManageOrganizations: false,
    role: role
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
