const express = require('express');
const router = express.Router();
const { query } = require('../../core/db');
const { authenticateToken } = require('../../core/auth');

// GET /api/services/board/posts?category=stock
router.get('/posts', authenticateToken, async (req, res) => {
  const { category } = req.query;
  try {
    let sql = `
      SELECT p.*, 
             u.raw_user_meta_data->>'name' as author_name,
             (SELECT count(*) FROM board_comments c WHERE c.post_id = p.id) as comments_count,
             (SELECT count(*) FROM board_post_likes l WHERE l.post_id = p.id) as likes_count
      FROM board_posts p
      LEFT JOIN auth.users u ON p.user_id = u.id
    `;
    const params = [];
    
    if (category) {
      sql += ` WHERE p.category = $1`;
      params.push(category);
    }
    
    sql += ` ORDER BY p.created_at DESC LIMIT 50`;
    
    const posts = await query.all(sql, params);
    
    const formatted = posts.map(p => ({
      id: p.id,
      title: p.title,
      content: p.content,
      author: p.author_name || '익명 사용자',
      likes: parseInt(p.likes_count || 0),
      comments: parseInt(p.comments_count || 0),
      time: new Date(p.created_at).toLocaleString('ko-KR')
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('[Board API] Failed to fetch posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/services/board/posts
router.post('/posts', authenticateToken, async (req, res) => {
  const { category, title, content } = req.body;
  const userId = req.user.id;
  
  if (!category || !title || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await query.get(`
      INSERT INTO board_posts (category, user_id, title, content)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
    `, [category, userId, title, content]);
    
    res.status(201).json({ success: true, post: result });
  } catch (error) {
    console.error('[Board API] Failed to create post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
