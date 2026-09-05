const fs = require('fs'); 
const content = fs.readFileSync('backend/service/politics/index.js', 'utf8'); 
let newContent = content.replace('p.role_type,', 'p.role_type, p.likes, p.dislikes,');
newContent = newContent.replace('namuwikiUrl: p.namuwiki_url,', 'namuwikiUrl: p.namuwiki_url,\n      likes: p.likes || 0,\n      dislikes: p.dislikes || 0,');
fs.writeFileSync('backend/service/politics/index.js', newContent);
