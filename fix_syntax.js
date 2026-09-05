const fs = require('fs');
let code = fs.readFileSync('frontend/src/apps/platform/pages/SystemHealthDashboard.jsx', 'utf8');

const regex = /<\/div>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*\);\s*}\s*$/;
if (regex.test(code)) {
    console.log('regex matches');
}

// Let's just find the last occurrence of   ); } and replace the previous lines
let lines = code.split('\n');
// We need to add one more </div> before the last </div>
let newLines = [];
let added = false;
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('</div>') && !added) {
        newLines.unshift('      </div>');
        newLines.unshift(lines[i]);
        added = true;
    } else {
        newLines.unshift(lines[i]);
    }
}
fs.writeFileSync('frontend/src/apps/platform/pages/SystemHealthDashboard.jsx', newLines.join('\n'));
