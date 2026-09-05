const fs = require('fs');
let code = fs.readFileSync('frontend/src/apps/platform/pages/SystemHealthDashboard.jsx', 'utf8');

code = code.replace(
  'const [metrics, setMetrics] = useState(null);',
  'const [metrics, setMetrics] = useState(null);\n  const [traffic, setTraffic] = useState(null);'
);

code = code.replace(
  '    fetchMetrics();\n    const interval = setInterval(() => {\n      fetchLogs();\n      fetchMetrics();',
  '    fetchMetrics();\n    fetchTraffic();\n    const interval = setInterval(() => {\n      fetchLogs();\n      fetchMetrics();\n      fetchTraffic();'
);

code = code.replace(
  '  const fetchMetrics = async () => {',
  `  const fetchTraffic = async () => {
    try {
      const res = await apiClient('/api/admin/sys-health/traffic', { method: 'GET' });
      if (res.success) setTraffic(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchMetrics = async () => {`
);

code = code.replace(
  '<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">',
  '<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">'
);

code = code.replace(
  '        </div>\n      )}\n\n      {/* HITL CURATION PANEL */}',
  `          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center">
            <span className="text-slate-400 text-sm font-semibold mb-1">오늘 방문자 (Traffic 24h)</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-rose-400">{traffic ? traffic.unique_visitors : 0}</span>
              <span className="text-sm text-slate-500 mb-1">UV</span>
            </div>
            <div className="text-xs text-slate-500 mt-2">Total PV: {traffic ? traffic.total_views : 0}</div>
          </div>
        </div>
      )}

      {/* HITL CURATION PANEL */}`
);

fs.writeFileSync('frontend/src/apps/platform/pages/SystemHealthDashboard.jsx', code);
console.log('Patched traffic');
