const fs = require('fs');
let code = fs.readFileSync('frontend/src/apps/platform/pages/SystemHealthDashboard.jsx', 'utf8');

// The Trends card currently says onClick={() => openDrawer('pipelines')} instead of 'trends'
// There are multiple. The first one is sources, second is politicians, third is pipelines, fourth is pipelines.
// The third one is Trends.
// Let's find "수집된 트렌드 (Trend Data)"
let lines = code.split('\n');
let modified = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('수집된 트렌드 (Trend Data)')) {
        // The div enclosing it is the previous line or a few lines before.
        for (let j = i - 1; j >= i - 5; j--) {
            if (lines[j].includes('openDrawer(\'pipelines\')')) {
                lines[j] = lines[j].replace('openDrawer(\'pipelines\')', 'openDrawer(\'trends\')');
                modified = true;
                break;
            }
        }
    }
}
code = lines.join('\n');

// Add the rendering block for 'trends'
const trendsBlock = `
                  {drawerType === 'trends' && (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-800 text-slate-400"><tr><th className="p-2">Name</th><th className="p-2">Record Date</th><th className="p-2">Buzz Score</th><th className="p-2">Approval</th></tr></thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {drawerData.slice((drawerPage - 1) * 20, drawerPage * 20).map(t => (
                          <tr key={t.id}>
                            <td className="p-2 font-medium">{t.politician_name}</td>
                            <td className="p-2 text-xs">{new Date(t.record_date).toLocaleDateString()}</td>
                            <td className="p-2">{t.buzz_score}</td>
                            <td className="p-2">{t.approval_rating}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
`;
code = code.replace(
  "{drawerType === 'pipelines' && (",
  trendsBlock + "\n                  {drawerType === 'pipelines' && ("
);

fs.writeFileSync('frontend/src/apps/platform/pages/SystemHealthDashboard.jsx', code);
console.log('Patched trends drawer');
