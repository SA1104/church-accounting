/**
 * Booza Think Platform OS - Tenant Manager Stub
 */

function getTenantContext(req) {
  // Resolve project context based on headers or query parameters
  const projectId = req.headers['x-project-id'] || req.query.projectId || null;
  return {
    projectId
  };
}

module.exports = {
  getTenantContext
};
