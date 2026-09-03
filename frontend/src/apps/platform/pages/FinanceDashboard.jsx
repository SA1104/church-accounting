import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../core/api';

const FinanceDashboard = () => {
  const [assets, setAssets] = useState([]);
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetRes, costRes] = await Promise.all([
          apiClient('/api/admin/finance/assets'),
          apiClient('/api/admin/finance/costs')
        ]);
        
        if (assetRes.success) setAssets(assetRes.data);
        if (costRes.success) setCosts(costRes.data);
      } catch (err) {
        console.error('Failed to load finance data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getDDay = (expDate) => {
    const diff = new Date(expDate).getTime() - new Date().getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return <span className="text-red-400 font-bold">D+{Math.abs(days)} (EXPIRED)</span>;
    if (days <= 30) return <span className="text-orange-400 font-bold">D-{days}</span>;
    return <span className="text-emerald-400">D-{days}</span>;
  };

  const totalMonthlyCost = costs.reduce((sum, cost) => sum + cost.amount_krw, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 select-none">
      <div className="mb-8 border-b border-slate-800 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Finance & Legal Dashboard</h1>
          <p className="text-slate-400 mt-2">플랫폼 유지보수 비용 및 인프라 자산(도메인/인증서) 만료일 추적</p>
        </div>
        <div>
          <button onClick={() => window.location.href='/_admin/sys-health'} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm font-semibold transition-colors text-slate-300 border border-slate-600">
            Go to System Health
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 text-slate-500">데이터를 불러오는 중입니다...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Costs Panel */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">💸</span> Monthly Run Rate
                </h2>
                <p className="text-sm text-slate-400 mt-1">최근 청구된 월별 유지 비용</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total (KRW)</p>
                <p className="text-3xl font-black text-rose-400">₩{totalMonthlyCost.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 text-xs font-semibold tracking-wider text-slate-400 uppercase border-b border-slate-800">
                    <th className="p-4">Category</th>
                    <th className="p-4">Month</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {costs.length === 0 ? (
                    <tr><td colSpan="4" className="p-6 text-center text-slate-500">No cost data available.</td></tr>
                  ) : (
                    costs.map(cost => (
                      <tr key={cost.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs border border-slate-700">
                            {cost.category}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">{cost.year_month}</td>
                        <td className="p-4 text-slate-300">{cost.description}</td>
                        <td className="p-4 text-right font-medium text-rose-300">₩{cost.amount_krw.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assets Panel */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 bg-slate-900">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">⏳</span> Infrastructure Assets
              </h2>
              <p className="text-sm text-slate-400 mt-1">도메인, SSL 인증서, SaaS 구독 만료일</p>
            </div>
            
            <div className="p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 text-xs font-semibold tracking-wider text-slate-400 uppercase border-b border-slate-800">
                    <th className="p-4">Asset</th>
                    <th className="p-4">Provider</th>
                    <th className="p-4">Exp. Date</th>
                    <th className="p-4 text-right">D-Day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {assets.length === 0 ? (
                    <tr><td colSpan="4" className="p-6 text-center text-slate-500">No assets available.</td></tr>
                  ) : (
                    assets.map(asset => (
                      <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-200">{asset.name}</span>
                            <span className="text-xs text-slate-500 mt-1">{asset.asset_type}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-400">{asset.provider}</td>
                        <td className="p-4 text-slate-400">{asset.expiration_date}</td>
                        <td className="p-4 text-right">{getDDay(asset.expiration_date)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceDashboard;
