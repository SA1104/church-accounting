const fs = require('fs');
let code = fs.readFileSync('frontend/src/apps/platform/pages/SystemHealthDashboard.jsx', 'utf8');

// Add states
code = code.replace(
  'const [metrics, setMetrics] = useState(null);',
  `const [metrics, setMetrics] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState(null);
  const [drawerData, setDrawerData] = useState(null);

  const openDrawer = async (type) => {
    setDrawerType(type);
    setDrawerOpen(true);
    setDrawerData(null);
    try {
      const res = await apiClient(\`/api/admin/sys-health/details/\${type}\`, { method: 'GET' });
      if (res.success) setDrawerData(res.data);
    } catch (e) { console.error(e); }
  };`
);

// Replace 4 KPI divs with clickable ones
code = code.replace(
  '<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center">',
  '<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => openDrawer(\'sources\')}>'
);
code = code.replace(
  '<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center">',
  '<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => openDrawer(\'politicians\')}>'
);
// For the third one (trends), maybe we don't have a trend details endpoint yet, we just map it to pipelines for now or leave it empty, but user asked for trend details. Let's map it to pipelines for now or just don't click.
code = code.replace(
  '<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center">',
  '<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => openDrawer(\'pipelines\')}>'
);
code = code.replace(
  '<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center">',
  '<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => openDrawer(\'pipelines\')}>'
);

// Add Drawer UI at the end before last closing div
const drawerUI = `
      {/* RIGHT SIDE DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setDrawerOpen(false)} />
          <div className="w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl transform transition-transform p-6 flex flex-col h-full z-10 relative">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
              <h2 className="text-xl font-bold text-white capitalize">{drawerType} Details</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              {!drawerData ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {drawerType === 'politicians' && (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-800 text-slate-400"><tr><th className="p-2">Name</th><th className="p-2">Party</th><th className="p-2">Birth</th><th className="p-2">Photo</th></tr></thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {drawerData.map(p => (
                          <tr key={p.id}>
                            <td className="p-2 font-medium">{p.name}</td>
                            <td className="p-2 text-xs">{p.party_name}</td>
                            <td className="p-2">{p.has_birth ? '✅' : '❌'}</td>
                            <td className="p-2">{p.has_image ? '✅' : '❌'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {drawerType === 'sources' && (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-800 text-slate-400"><tr><th className="p-2">Name</th><th className="p-2">Type</th><th className="p-2">Endpoint</th><th className="p-2">Status</th></tr></thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {drawerData.map(s => (
                          <tr key={s.id}>
                            <td className="p-2 font-medium">{s.name}</td>
                            <td className="p-2"><span className="px-2 py-0.5 bg-indigo-900/50 text-indigo-300 rounded text-xs">{s.type}</span></td>
                            <td className="p-2 font-mono text-xs">{s.endpoint}</td>
                            <td className="p-2">{s.status === 'Active' ? '🟢' : '⚪'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {drawerType === 'pipelines' && (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-800 text-slate-400"><tr><th className="p-2">Job Name</th><th className="p-2">Last Run</th><th className="p-2">Success</th><th className="p-2">Error</th></tr></thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {drawerData.map(j => (
                          <tr key={j.job_name}>
                            <td className="p-2 font-medium">{j.job_name}</td>
                            <td className="p-2 text-xs">{new Date(j.last_run).toLocaleString()}</td>
                            <td className="p-2 text-green-400 font-bold">{j.success_count}</td>
                            <td className="p-2 text-red-400 font-bold">{j.error_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/    <\/div>\s*<\/div>\s*\);\s*}/, drawerUI + '    </div>\n  );\n}');

fs.writeFileSync('frontend/src/apps/platform/pages/SystemHealthDashboard.jsx', code);
console.log('Patched');
