const fs = require('fs'); 
const content = fs.readFileSync('backend/service/politics/index.js', 'utf8'); 
const routes = `
// POST /api/services/politics/community/:id/like
router.post('/community/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('UPDATE politics_comments SET likes = COALESCE(likes, 0) + 1 WHERE id = $1 RETURNING likes', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Comment not found' });
    res.json({ success: true, likes: result.rows[0].likes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/services/politics/community/:id/dislike
router.post('/community/:id/dislike', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('UPDATE politics_comments SET dislikes = COALESCE(dislikes, 0) + 1 WHERE id = $1 RETURNING dislikes', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Comment not found' });
    res.json({ success: true, dislikes: result.rows[0].dislikes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
`;
const idx = content.lastIndexOf('module.exports = router;');
fs.writeFileSync('backend/service/politics/index.js', content.slice(0, idx) + routes + content.slice(idx));
