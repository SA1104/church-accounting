const fs = require('fs');
const lines = fs.readFileSync('frontend/src/apps/platform/pages/SystemHealthDashboard.jsx', 'utf8').split('\n');
const idx = lines.findIndex(l => l.includes("drawerType === 'politicians'"));
console.log(lines.slice(idx - 2, idx + 25).join('\n'));
