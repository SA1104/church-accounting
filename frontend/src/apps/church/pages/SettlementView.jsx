import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../App';
import { Download, Layers, ListFilter } from 'lucide-react';

export default function SettlementView() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // 필터 조건
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [half, setHalf] = useState('FIRST');
  const [organizations, setOrganizations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(user.groupId || '');

  // 결산 상태
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, [token]);

  useEffect(() => {
    if (selectedOrg) {
      fetchGroups(selectedOrg);
    } else {
      setGroups([]);
      setSelectedGroup('');
    }
  }, [selectedOrg]);

  useEffect(() => {
    if (year && half) {
      fetchSettlement();
    }
  }, [token, selectedOrg, selectedGroup, year, half]);

  const fetchOrganizations = async () => {
    if (user.role === 'SYSTEM_ADMIN' || user.role === 'AUDITOR') {
      try {
        const response = await fetch('/api/organizations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setOrganizations(data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const fetchGroups = async (orgId) => {
    try {
      const response = await fetch(`/api/groups?orgId=${orgId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setGroups(data);
      setSelectedGroup('');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettlement = async () => {
    setLoading(true);
    try {
      let url = `/api/ledgers/settlement?year=${year}&half=${half}`;
      if (selectedGroup) {
        url += `&group=${selectedGroup}`;
      } else if (selectedOrg) {
        url += `&org=${selectedOrg}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setReport(data);
    } catch (err) {
      console.error('Fetch settlement error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    let url = `/api/ledgers/settlement/excel?year=${year}&half=${half}`;
    if (selectedGroup) {
      url += `&group=${selectedGroup}`;
    } else if (selectedOrg) {
      url += `&org=${selectedOrg}`;
    }

    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Excel download failed');
      return res.blob();
    })
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `settlement-${year}-${half}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(err => {
      alert('엑셀 다운로드 실패: ' + err.message);
    });
  };

  const formatKrw = (amount) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* 탭 헤더 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/reports')} 
            className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl transition-colors"
          >
            월별 장부
          </button>
          <button 
            onClick={() => navigate('/reports/settlement')} 
            className="text-xs font-bold text-church-400 bg-church-500/10 px-3 py-1.5 rounded-xl border border-church-500/20"
          >
            반기 결산보고서
          </button>
        </div>

        <button
          onClick={downloadExcel}
          disabled={!report || report.details?.length === 0}
          className="bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50"
        >
          <Download size={13} /> 엑셀 다운
        </button>
      </div>

      {/* 결산 필터 */}
      <div className="glass p-3 rounded-2xl space-y-2.5">
        {(user.role === 'SYSTEM_ADMIN' || user.role === 'AUDITOR') && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 flex items-center gap-0.5"><ListFilter size={10} /> 위원회</span>
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="">전체 위원회 통합</option>
                {organizations.map(o => (
                  <option key={o.organization_id} value={o.organization_id}>{o.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 flex items-center gap-0.5"><ListFilter size={10} /> 소속 그룹</span>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                disabled={!selectedOrg}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none disabled:opacity-35"
              >
                <option value="">전체 소속그룹 통합</option>
                {groups.map(g => (
                  <option key={g.group_id} value={g.group_id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500">회계 연도</span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="2026">2026년도</option>
              <option value="2025">2025년도</option>
              <option value="2024">2024년도</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500">반기 구분</span>
            <select
              value={half}
              onChange={(e) => setHalf(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="FIRST">상반기 (1월~6월)</option>
              <option value="SECOND">하반기 (7월~12월)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 결산 리스트 */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1">
          <Layers size={13} className="text-church-400" /> 계정과목별 반기 집계 내역
        </h3>

        {loading ? (
          <div className="text-center text-xs text-slate-500 py-12">결산 정보를 계산 중입니다...</div>
        ) : !report || report.details?.length === 0 ? (
          <div className="glass p-8 rounded-2xl text-center text-slate-500 text-xs border border-dashed border-slate-800">
            조회된 결산 데이터가 없습니다.
          </div>
        ) : (
          report.details.map((item, idx) => {
            const isIncome = item.type === 'INCOME';
            return (
              <div key={idx} className="glass p-3.5 rounded-2xl space-y-2 border border-slate-800/40 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {isIncome ? '수입' : '지출'}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5">
                      {item.parent_category} &gt; {item.child_category}
                    </h4>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">실적 금액</span>
                    <span className={`text-xs font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatKrw(item.amount)}
                    </span>
                  </div>
                </div>

                {!isIncome && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                      <span>반기 예산액: {formatKrw(item.budget_amount)}</span>
                      <span>집행률: <strong className="text-church-400">{item.execution_rate}%</strong></span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/50">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          item.execution_rate > 90 ? 'bg-rose-500' : item.execution_rate > 50 ? 'bg-church-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, item.execution_rate)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
