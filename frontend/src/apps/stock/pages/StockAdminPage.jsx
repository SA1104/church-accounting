import { useState, useEffect } from 'react';
import { ShieldCheck, LayoutTemplate, Activity, RefreshCw } from 'lucide-react';

export default function StockAdminPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/stock/admin/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setHealth(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const StatusIcon = ({ status }) => {
    if (status === 'READY' || status === 'APPLIED' || status === 'CONFIGURED' || status === 'CONNECTED') {
      return <ShieldCheck size={18} className="text-emerald-500" />;
    }
    return <Activity size={18} className="text-amber-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Stock Data Admin</h1>
          <p className="text-sm text-slate-500 mt-1">데이터 소스 준비 상태 및 파이프라인 관리 (Phase 1A)</p>
        </div>
        <button 
          onClick={fetchHealth} 
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-200 text-sm font-bold shadow-sm">
          Failed to load health status: {error}
        </div>
      )}

      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity size={18} className="text-indigo-600" /> System Status
            </h2>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-600 font-semibold">Database Connection</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-700">{health.data.health}</span>
                <StatusIcon status={health.data.health === 'UP' ? 'READY' : 'DOWN'} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <LayoutTemplate size={18} className="text-indigo-600" /> Data Pipeline
            </h2>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-600 font-semibold">API Providers Configured</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-700">{health.data.config}</span>
                <StatusIcon status={health.data.config} />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-indigo-50 border border-indigo-200 rounded-2xl p-5 shadow-sm mt-2">
            <h3 className="text-sm font-bold text-indigo-700 mb-2">Phase 1A Mock Data Notice</h3>
            <p className="text-xs text-indigo-900/80 leading-relaxed">
              현재 Stock Think 애플리케이션은 Phase 1A UI/UX 골격 검증 단계에 있습니다.<br/>
              실제 KRX / ECOS / OPENDART 실시간 데이터 수집 및 데이터베이스 쓰기 파이프라인은 ALLOW_STOCK_DATA_WRITE=YES_DEV_ONLY 환경변수 통제 하에 안전하게 격리되어 있으며, 라이브 전환은 Phase 2A에서 진행됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
