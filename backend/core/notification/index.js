/**
 * Booza Think Platform OS - Notification dispatcher stub
 */
const { query } = require('../db');

async function sendNotification(userId, projectId, type, message, targetUrl = '', options = {}) {
  try {
    await query.run(`
      INSERT INTO platform_notifications (
        user_id, project_id, type, message, target_url, is_read, status,
        workspace_id, capability, context_type, context_id, resource_type, resource_id
      )
      VALUES (?, ?, ?, ?, ?, 0, 'UNREAD', ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      projectId,
      type,
      message,
      targetUrl,
      options.workspace_id || null,
      options.capability || null,
      options.context_type || null,
      options.context_id || null,
      options.resource_type || null,
      options.resource_id || null
    ]);
  } catch (error) {
    console.error('[Notification Engine] Failed to dispatch notification:', error.message);
  }
}

module.exports = {
  sendNotification
};
