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

  useEffect(() => {
    fetchLogs();
    fetchCandidates('stock');
    fetchMetrics();
    const interval = setInterval(() => {
      fetchLogs();
      fetchMetrics();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center">
            <span className="text-slate-400 text-sm font-semibold mb-1">연동된 API (Data Sources)</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-indigo-400">{metrics.total_apis}</span>
              <span className="text-sm text-slate-500 mb-1">개</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center">
            <span className="text-slate-400 text-sm font-semibold mb-1">수집된 정치인 (Politicians)</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-blue-400">{metrics.db_records.politicians.toLocaleString()}</span>
              <span className="text-sm text-slate-500 mb-1">명</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center">
            <span className="text-slate-400 text-sm font-semibold mb-1">수집된 트렌드 (Trend Data)</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-emerald-400">{metrics.db_records.trends.toLocaleString()}</span>
              <span className="text-sm text-slate-500 mb-1">건</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-center">
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
        </div>
      )}

      {/* HITL CURATION PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">AI Insight Curation (HITL)</h2>
          <div className="flex space-x-2">
            {['stock', 'real_estate', 'economy', 'politics'].map(cat => (
              <button 
                key={cat} 
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1 rounded text-sm font-medium ${activeCategory === cat ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded mb-4 text-sm">
          <span className="text-slate-300">Selected: <strong className="text-white">{selectedIds.size}</strong> articles</span>
          <button onClick={triggerHITL} disabled={selectedIds.size === 0 || triggering} className="px-4 py-1.5 bg-green-600 hover:bg-green-500 rounded font-semibold transition-colors disabled:opacity-50">
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
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-3 font-mono text-slate-300">{new Date(log.created_at).toLocaleString('ko-KR')}</td>
                  <td className="px-6 py-3 font-medium text-slate-200">{log.job_name}</td>
                  <td className="px-6 py-3 text-slate-400">{log.status}</td>
                  <td className="px-6 py-3 text-slate-400 whitespace-normal text-xs">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
