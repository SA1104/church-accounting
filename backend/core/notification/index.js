/**
 * Booza Think Platform OS - Notification dispatcher stub
 */
const { query } = require('../db');

async function sendNotification(userId, projectId, type, message, targetUrl = '') {
  try {
    await query.run(`
      INSERT INTO platform_notifications (user_id, project_id, type, message, target_url, is_read, status)
      VALUES (?, ?, ?, ?, ?, 0, 'UNREAD')
    `, [userId, projectId, type, message, targetUrl]);
  } catch (error) {
    console.error('[Notification Engine] Failed to dispatch notification:', error.message);
  }
}

module.exports = {
  sendNotification
};
