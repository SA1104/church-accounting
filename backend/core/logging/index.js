/**
 * Booza Think Platform OS - Logging Engine Stub
 */
const { query } = require('../db');

async function writeAuditLog(userId, serviceId, projectId, action, details, ipAddress = '0.0.0.0', result = 'SUCCESS') {
  try {
    await query.run(`
      INSERT INTO platform_audit_logs (user_id, service_id, project_id, action, details, ip_address, result)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, serviceId, projectId, action, details, ipAddress, result]);
  } catch (error) {
    console.error('[Logging Engine] Failed to write audit log:', error.message);
  }
}

module.exports = {
  writeAuditLog
};
