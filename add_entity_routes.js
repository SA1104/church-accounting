const fs = require('fs'); 
const content = fs.readFileSync('backend/service/politics/index.js', 'utf8'); 
const routes = `
// POST /api/services/politics/politician/:id/interaction
router.post('/politician/:id/interaction', async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'like' or 'dislike'
    if (type !== 'like' && type !== 'dislike') return res.status(400).json({ success: false });
    
    const col = type === 'like' ? 'likes' : 'dislikes';
    const result = await pool.query(\`UPDATE politics_politicians SET \${col} = COALESCE(\${col}, 0) + 1 WHERE id = $1 RETURNING likes, dislikes\`, [id]);
    
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/services/politics/party/:name/interaction
router.post('/party/:name/interaction', async (req, res) => {
  try {
    const { name } = req.params;
    const { type } = req.body; // 'like' or 'dislike'
    if (type !== 'like' && type !== 'dislike') return res.status(400).json({ success: false });
    
    const col = type === 'like' ? 'likes' : 'dislikes';
    
    // Upsert into politics_parties
    const result = await pool.query(\`
      INSERT INTO politics_parties (name, \${col}) 
      VALUES ($1, 1) 
      ON CONFLICT (name) 
      DO UPDATE SET \${col} = politics_parties.\${col} + 1 
      RETURNING likes, dislikes
    \`, [name]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/services/politics/parties
router.get('/parties', async (req, res) => {
  try {
    const result = await pool.query('SELECT name, likes, dislikes FROM politics_parties');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
`;
const idx = content.lastIndexOf('module.exports = router;');
fs.writeFileSync('backend/service/politics/index.js', content.slice(0, idx) + routes + content.slice(idx));
