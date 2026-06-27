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

module.exports = {
  requireRole
};
