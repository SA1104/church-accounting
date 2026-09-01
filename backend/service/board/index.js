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

// GET /api/services/board/news (Mocked for now until Naver API is connected)
router.get('/news', authenticateToken, async (req, res) => {
  const { category } = req.query;
  
  // Fake news data based on category
  const news = [
    { id: 1, title: `[속보] ${category} 관련 글로벌 시장 변동성 확대`, summary: `최근 경제 지표 발표 이후 ${category} 섹터의 투심이 급격히 변화하고 있습니다. 전문가들은 단기적인 리스크 관리가 필요하다고 조언합니다.`, link: 'https://news.naver.com' },
    { id: 2, title: `전문가들이 꼽은 ${category} 핵심 투자 전략`, summary: `하반기 금리 인하 기대감이 선반영된 가운데, 옥석 가리기가 본격화될 전망입니다. 밸류에이션 매력이 높은 자산에 주목해야 합니다.`, link: 'https://news.naver.com' },
    { id: 3, title: `기관/외국인 ${category} 대규모 순매수 행진`, summary: `외국인 자금이 연속으로 유입되며 시장을 견인하고 있습니다. 특히 주도주 위주의 포트폴리오 재편이 눈에 띕니다.`, link: 'https://news.naver.com' },
    { id: 4, title: `정부, ${category} 규제 완화 카드 만지작`, summary: `시장 활성화를 위해 관련 부처가 규제 완화 패키지를 준비 중인 것으로 알려졌습니다. 빠르면 다음 달 구체적인 방안이 발표될 예정입니다.`, link: 'https://news.naver.com' }
  ];
  
  res.json(news);
});

module.exports = router;
