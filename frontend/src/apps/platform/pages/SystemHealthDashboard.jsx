import { useState, useEffect } from 'react';
import { apiClient } from '../../../core/api';

export default function SystemHealthDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    fetchLogs();
    // Poll every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await apiClient.get('/api/admin/sys-health/cron-logs');
      if (res.success) {
        setLogs(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch cron logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerJob = async (jobName) => {
    if (triggering) return;
    setTriggering(true);
    try {
      const res = await apiClient.post('/api/admin/sys-health/trigger', { job_name: jobName });
      if (res.success) {
        alert(`${jobName} started successfully.`);
        setTimeout(fetchLogs, 2000); // Fetch after short delay
      } else {
        alert(`Failed to start ${jobName}: ${res.error}`);
      }
    } catch (err) {
      alert(`Error triggering job: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded text-xs font-bold">SUCCESS</span>;
      case 'FAILED':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded text-xs font-bold">FAILED</span>;
      case 'SKIPPED':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded text-xs font-bold">SKIPPED</span>;
      default:
        return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 border border-slate-500/50 rounded text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health & Cron Monitor</h1>
          <p className="text-slate-400 mt-1">Real-time background tasks monitor</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => triggerJob('generate_politics_insight')}
            disabled={triggering}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Trigger Politics Insight
          </button>
          <button 
            onClick={() => triggerJob('sync_assembly_members')}
            disabled={triggering}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Trigger Assembly Sync
          </button>
          <button 
            onClick={fetchLogs} 
            className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded text-sm font-semibold transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="uppercase tracking-wider border-b border-slate-700 bg-slate-800 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Time (KST)</th>
                <th className="px-6 py-4 font-medium">Job Name</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium w-full">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No cron job logs found.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 font-mono text-slate-300">
                      {new Date(log.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-200">{log.job_name}</td>
                    <td className="px-6 py-3">{getStatusBadge(log.status)}</td>
                    <td className="px-6 py-3 text-slate-400">{log.execution_time ? `${log.execution_time}ms` : '-'}</td>
                    <td className="px-6 py-3 text-slate-400 whitespace-normal text-xs">{log.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
