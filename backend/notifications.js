const express = require('express');
const router = express.Router();
const { query } = require('./db');
const { authenticateToken } = require('./auth');

// 알림 생성 공통 헬퍼 함수
async function createNotification(userId, type, message, targetUrl = null) {
  try {
    await query.run(`
      INSERT INTO notifications (user_id, type, message, target_url)
      VALUES (?, ?, ?, ?)
    `, [userId, type, message, targetUrl]);
    console.log(`Notification created for user ${userId}: ${message}`);
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
}

// 1. 로그인한 유저의 최근 알림 리스트 조회
router.get('/', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    const notifications = await query.all(`
      SELECT * FROM notifications 
      WHERE user_id = ? AND status != 'ARCHIVED'
      ORDER BY created_at DESC 
      LIMIT 50
    `, [userId]);
    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 1.5 관리자용 전체 알림 이력 조회 (SYSTEM_ADMIN, FINANCE_MANAGER)
router.get('/all', authenticateToken, async (req, res) => {
  const { role } = req.user;
  if (role !== 'SYSTEM_ADMIN' && role !== 'AUDITOR') {
    return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
  }
  try {
    const notifications = await query.all(`
      SELECT n.*, u.name as user_name, u.username as user_username
      FROM notifications n
      JOIN users u ON n.user_id = u.user_id
      ORDER BY n.created_at DESC
    `);
    res.json(notifications);
  } catch (error) {
    console.error('Fetch all notifications error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 2. 전체 알림 읽음 처리
router.put('/read-all', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    const result = await query.run(`
      UPDATE notifications 
      SET is_read = 1, status = 'READ' 
      WHERE user_id = ? AND status = 'UNREAD'
    `, [userId]);
    res.json({ message: 'All notifications marked as read', changes: result.changes });
  } catch (error) {
    console.error('Read all notifications error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// 3. 단일 알림 읽음 처리
router.put('/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  try {
    const result = await query.run(`
      UPDATE notifications 
      SET is_read = 1, status = 'READ' 
      WHERE notification_id = ? AND user_id = ?
    `, [parseInt(id, 10), userId]);
    res.json({ message: 'Notification marked as read', changes: result.changes });
  } catch (error) {
    console.error('Read notification error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = {
  router,
  createNotification
};
