const fs = require('fs');
let code = fs.readFileSync('frontend/src/apps/politics/components/CommentsPanel.jsx', 'utf8');

code = code.replace(
`      const payload = {
        content: newComment,
        user_name: userName.trim() || '익명 유권자',
        password: password || ''
      };`,
`      let userId = null;
      try {
        const u = JSON.parse(localStorage.getItem('user'));
        if (u && u.id) userId = u.id;
      } catch (e) {}

      const payload = {
        content: newComment,
        user_name: userName.trim() || '익명 유권자',
        password: password || '',
        user_id: userId
      };`
);

fs.writeFileSync('frontend/src/apps/politics/components/CommentsPanel.jsx', code);
console.log('Patched CommentsPanel.jsx');
