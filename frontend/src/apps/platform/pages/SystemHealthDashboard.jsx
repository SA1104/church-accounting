import { useState, useEffect } from 'react';
import { apiClient } from '../../../core/api';

export default function SystemHealthDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeCategory, setActiveCategory] = useState('stock');
  const [metrics, setMetrics] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState(null);
  const [drawerData, setDrawerData] = useState(null);
  const [logPage, setLogPage] = useState(1);
  const [drawerPage, setDrawerPage] = useState(1);

  const openDrawer = async (type) => {
    setDrawerType(type);
    setDrawerOpen(true);
    setDrawerData(null);
    setDrawerPage(1);
    try {
      const res = await apiClient(`/api/admin/sys-health/details/${type}`, { method: 'GET' });
      if (res.success) setDrawerData(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchLogs();
    fetchCandidates('stock');
    fetchMetrics();
    fetchTraffic();
    const interval = setInterval(() => {
      fetchLogs();
      fetchMetrics();
      fetchTraffic();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTraffic = async () => {
    try {
      const res = await apiClient('/api/admin/sys-health/traffic', { method: 'GET' });
      if (res.success) setTraffic(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchMetrics = async () => {
    try {
      const res = await apiClient('/api/admin/sys-health/metrics', { method: 'GET' });
      if (res.success) setMetrics(res.data);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await apiClient('/api/admin/sys-health/cron-logs', { method: 'GET' });
      if (res.success) setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch cron logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async (category) => {
    try {
      const res = await apiClient(`/api/admin/sys-health/candidates?category=${category}`, { method: 'GET' });
      if (res.success) {
        setCandidates(res.data || []);
        setSelectedIds(new Set()); // Reset selections on category change
      }
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    }
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    fetchCandidates(cat);
  };

  const toggleSelection = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const triggerHITL = async () => {
    if (selectedIds.size === 0) return alert('Please select at least one article.');
    if (triggering) return;
    setTriggering(true);
    try {
      const res = await apiClient('/api/admin/sys-health/generate-hitl', { 
        method: 'POST', 
        body: JSON.stringify({ category: activeCategory, candidateIds: Array.from(selectedIds) }) 
      });
      if (res.success) {
        alert(`Generation started for ${activeCategory} with ${selectedIds.size} articles.`);
        setSelectedIds(new Set());
        fetchCandidates(activeCategory);
      } else {
        alert(`Failed: ${res.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  const triggerJob = async (jobName) => {
    if (triggering) return;
    setTriggering(true);
    try {
      const res = await apiClient('/api/admin/sys-health/trigger', { 
        method: 'POST', 
        body: JSON.stringify({ job_name: jobName }) 
      });
      if (res.success) {
        alert(`${jobName} started successfully.`);
        setTimeout(fetchLogs, 2000);
      } else {
        alert(`Failed to start ${jobName}: ${res.error}`);
      }
    } catch (err) {
      alert(`Error triggering job: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-white min-h-screen pb-20">
      
      {/* HEADER */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">System Health & Curation</h1>
            <p className="text-slate-400 mt-2">Real-time background tasks and AI Human-in-the-Loop Curation</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.location.href='/_admin/finance'} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm font-semibold transition-colors text-slate-300 border border-slate-600">
              Go to Finance & Legal
            </button>
            <button onClick={() => triggerJob('generate_politics_insight')} disabled={triggering} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold transition-colors disabled:opacity-50">
              Fetch New News (Cron)
            </button>
            <button onClick={() => triggerJob('sync_assembly_members')} disabled={triggering} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-semibold transition-colors disabled:opacity-50">
              Trigger Assembly Sync
            </button>
            <button onClick={fetchLogs} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-semibold transition-colors border border-slate-600">
              Refresh Logs
            </button>
          </div>
        </div>

      {/* KPI METRICS OVERVIEW */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => openDrawer('sources')}>
            <span className="text-slate-400 text-sm font-semibold mb-1">연동된 API (Data Sources)</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-indigo-400">{metrics.total_apis}</span>
              <span className="text-sm text-slate-500 mb-1">개</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => openDrawer('politicians')}>
            <span className="text-slate-400 text-sm font-semibold mb-1">수집된 정치인 (Politicians)</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-blue-400">{metrics.db_records.politicians.toLocaleString()}</span>
              <span className="text-sm text-slate-500 mb-1">명</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => openDrawer('trends')}>
            <span className="text-slate-400 text-sm font-semibold mb-1">수집된 트렌드 (Trend Data)</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-emerald-400">{metrics.db_records.trends.toLocaleString()}</span>
              <span className="text-sm text-slate-500 mb-1">건</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => openDrawer('pipelines')}>
            <span className="text-slate-400 text-sm font-semibold mb-1">파이프라인 성공률 (24h)</span>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-black ${metrics.pipeline_health.success_rate >= 90 ? 'text-green-400' : 'text-yellow-400'}`}>
                {metrics.pipeline_health.success_rate}
              </span>
              <span className="text-sm text-slate-500 mb-1">%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 mt-3 rounded-full overflow-hidden">
              <div className={`h-full ${metrics.pipeline_health.success_rate >= 90 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${metrics.pipeline_health.success_rate}%` }}></div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center">
            <span className="text-slate-400 text-sm font-semibold mb-1">오늘 방문자 (Traffic 24h)</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-rose-400">{traffic ? traffic.unique_visitors : 0}</span>
              <span className="text-sm text-slate-500 mb-1">UV</span>
            </div>
            <div className="text-xs text-slate-500 mt-2">Total PV: {traffic ? traffic.total_views : 0}</div>
          </div>
        </div>
      )}

      {/* HITL CURATION PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
          <h2 className="text-xl font-bold">AI Insight Curation (HITL)</h2>
          <div className="flex flex-wrap gap-2">
            {['stock', 'real_estate', 'economy', 'politics'].map(cat => (
              <button 
                key={cat} 
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1 rounded text-sm font-medium shrink-0 ${activeCategory === cat ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800/50 p-3 rounded mb-4 text-sm gap-3">
          <span className="text-slate-300">Selected: <strong className="text-white">{selectedIds.size}</strong> articles</span>
          <button onClick={triggerHITL} disabled={selectedIds.size === 0 || triggering} className="w-full sm:w-auto px-4 py-1.5 bg-green-600 hover:bg-green-500 rounded font-semibold transition-colors disabled:opacity-50">
            Approve & Generate AI Insight
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
          {candidates.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-800/20 rounded border border-dashed border-slate-700">No pending articles found for this category. Click 'Fetch New News' above.</div>
          ) : candidates.map(c => (
            <div key={c.id} onClick={() => toggleSelection(c.id)} className={`p-4 rounded border cursor-pointer transition-colors ${selectedIds.has(c.id) ? 'bg-purple-900/30 border-purple-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selectedIds.has(c.id)} readOnly className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600 bg-slate-900" />
                <div>
                  <h3 className="font-semibold text-slate-200">{c.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description}</p>
                  <a href={c.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-blue-400 hover:underline mt-2 inline-block">View Source</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SYSTEM LOGS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="uppercase tracking-wider border-b border-slate-700 bg-slate-800 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Time (KST)</th>
                <th className="px-6 py-4 font-medium">Job Name</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.slice((logPage - 1) * 10, logPage * 10).map(log => (
                <tr key={log.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-3 font-mono text-slate-300">{new Date(log.created_at).toLocaleString('ko-KR')}</td>
                  <td className="px-6 py-3 font-medium text-slate-200">{log.job_name}</td>
                  <td className={`px-6 py-3 font-bold ${log.status === 'FAILED' ? 'text-red-500' : 'text-slate-400'}`}>{log.status}</td>
                  <td className="px-6 py-3 text-slate-400 whitespace-normal text-xs">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
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
                        {drawerData.slice((drawerPage - 1) * 20, drawerPage * 20).map(p => (
                          <tr key={p.id}>
                            <td className="p-2 font-medium">
                              {p.namuwiki_url ? (
                                <a href={p.namuwiki_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                                  {p.name} 🔗
                                </a>
                              ) : p.name}
                            </td>
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
                        {drawerData.slice((drawerPage - 1) * 20, drawerPage * 20).map(s => (
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

                  {drawerType === 'pipelines' && (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-800 text-slate-400"><tr><th className="p-2">Job Name</th><th className="p-2">Last Run</th><th className="p-2">Success</th><th className="p-2">Error</th></tr></thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {drawerData.slice((drawerPage - 1) * 20, drawerPage * 20).map(j => (
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
            
            {/* DRAWER PAGINATION */}
            {drawerData && drawerData.length > 20 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                <button 
                  disabled={drawerPage === 1} 
                  onClick={() => setDrawerPage(p => p - 1)}
                  className="px-3 py-1 bg-slate-800 rounded text-slate-400 disabled:opacity-30 hover:bg-slate-700"
                >
                  Prev
                </button>
                <span className="text-slate-500 text-sm">
                  Page {drawerPage} of {Math.ceil(drawerData.length / 20)}
                </span>
                <button 
                  disabled={drawerPage >= Math.ceil(drawerData.length / 20)} 
                  onClick={() => setDrawerPage(p => p + 1)}
                  className="px-3 py-1 bg-slate-800 rounded text-slate-400 disabled:opacity-30 hover:bg-slate-700"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
      </div>
  );
}
