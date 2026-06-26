import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Download, ChevronLeft, ChevronRight, Plus, FileText, CheckCircle, ListFilter } from 'lucide-react';

export default function LedgerView() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // 연월 상태
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7));

  // 계층형 조직 필터 상태
  const [organizations, setOrganizations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(user.groupId || '');

  // 장부 상태
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 이월금 설정 모달 상태
  const [showCarryOverModal, setShowCarryOverModal] = useState(false);
  const [carryOverInput, setCarryOverInput] = useState('');
  const [settingCarryOver, setSettingCarryOver] = useState(false);

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
    fetchLedger();
  }, [token, selectedOrg, selectedGroup, yearMonth]);

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
      setSelectedGroup(''); // 그룹 리셋
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLedger = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `/api/ledgers?yearMonth=${yearMonth}`;
      if (selectedGroup) {
        url += `&group=${selectedGroup}`;
      } else if (selectedOrg) {
        url += `&org=${selectedOrg}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setLedger(data);
      setCarryOverInput(data.carry_over.toString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // [버그 수정] Timezone 영향을 받지 않는 로컬 연월 증감 계산 함수
  const changeMonth = (offset) => {
    const [y, m] = yearMonth.split('-').map(Number);
    // 15일을 기준으로 임시 Date 객체를 생성하여 timezone 밀림 문제 완전 차단
    const date = new Date(y, m - 1 + offset, 15);
    const nextY = date.getFullYear();
    const nextM = date.getMonth() + 1;
    setYearMonth(`${nextY}-${nextM < 10 ? '0' + nextM : nextM}`);
  };

  const handleSetCarryOver = async () => {
    if (!carryOverInput || isNaN(carryOverInput)) {
      alert('올바른 숫자를 입력하세요.');
      return;
    }

    setSettingCarryOver(true);
    try {
      const response = await fetch('/api/ledgers/carryover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          group: selectedGroup,
          yearMonth,
          carryOver: parseFloat(carryOverInput)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setShowCarryOverModal(false);
      fetchLedger();
    } catch (err) {
      alert(err.message);
    } finally {
      setSettingCarryOver(false);
    }
  };

  const downloadExcel = () => {
    let url = `/api/ledgers/excel?yearMonth=${yearMonth}`;
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
      link.download = `ledger-${yearMonth}.xlsx`;
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
            className="text-xs font-bold text-church-400 bg-church-500/10 px-3 py-1.5 rounded-xl border border-church-500/20"
          >
            월별 장부
          </button>
          <button 
            onClick={() => navigate('/reports/settlement')} 
            className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl transition-colors"
          >
            반기 결산보고서
          </button>
        </div>

        <button
          onClick={downloadExcel}
          disabled={!ledger || ledger.details?.length === 0}
          className="bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50"
        >
          <Download size={13} /> 엑셀 다운
        </button>
      </div>

      {/* 계층형 위원회 > 그룹 조회 드롭다운 필터 */}
      <div className="glass p-3 rounded-2xl flex flex-col gap-2.5">
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

        {/* 연월 증감 선택기 */}
        <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
          <button onClick={() => changeMonth(-1)} className="p-1 hover:text-white text-slate-400 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-white tracking-wider">{yearMonth} 장부 집계</span>
          <button onClick={() => changeMonth(1)} className="p-1 hover:text-white text-slate-400 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 장부 요약 */}
      {ledger && (
        <div className="glass p-4 rounded-2xl space-y-4 border border-slate-800 shadow-md">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <span className="text-[9px] text-slate-400 font-semibold block">
                {!selectedGroup && selectedOrg ? '위원회 통합 잔액' : !selectedGroup ? '교회 전체 통합 잔액' : '소속그룹 마감 잔액'}
              </span>
              <span className="text-lg font-bold text-white tracking-tight">{formatKrw(ledger.balance)}</span>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              ledger.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {ledger.status === 'APPROVED' ? '승인완료' : '미승인 장부'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-800/40 relative">
              <span className="text-[9px] text-slate-400 block mb-1">전월이월금</span>
              <span className="text-xs font-bold text-white">{formatKrw(ledger.carry_over)}</span>
              {/* 이월금 수정은 개별 그룹 선택 시에만 허용 */}
              {selectedGroup && ledger.status !== 'APPROVED' && (user.role === 'DEPARTMENT_ACCOUNTANT' || user.role === 'SYSTEM_ADMIN') && (
                <button
                  onClick={() => setShowCarryOverModal(true)}
                  className="absolute -top-1.5 -right-1.5 bg-church-600 hover:bg-church-500 text-white rounded-full p-1 shadow-md active:scale-95"
                  title="이월금 수동 설정"
                >
                  <Plus size={8} />
                </button>
              )}
            </div>

            <div className="bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
              <span className="text-[9px] text-emerald-400 block mb-1">총 수입</span>
              <span className="text-xs font-bold text-emerald-400">{formatKrw(ledger.total_income)}</span>
            </div>

            <div className="bg-rose-500/5 p-2 rounded-xl border border-rose-500/10">
              <span className="text-[9px] text-rose-400 block mb-1">총 지출</span>
              <span className="text-xs font-bold text-rose-400">{formatKrw(ledger.total_expense)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 장부 상세 내역 */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1">
          <FileText size={13} className="text-church-400" /> 반영 전표 리스트
        </h3>

        {loading ? (
          <div className="text-center text-xs text-slate-500 py-10">장부를 계산하고 있습니다...</div>
        ) : !ledger || ledger.details?.length === 0 ? (
          <div className="glass p-8 rounded-2xl flex flex-col items-center justify-center text-center text-slate-500 gap-1.5 border border-dashed border-slate-800">
            <CheckCircle size={32} className="text-slate-600" />
            <p className="text-xs font-bold">승인 완료된 전표가 없습니다.</p>
          </div>
        ) : (
          ledger.details.map((item, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`/vouchers/${item.voucher_id}`)}
              className="glass p-3 rounded-2xl flex items-center justify-between active:bg-slate-900/80 transition-all cursor-pointer border border-slate-800/40"
            >
              <div className="space-y-1 flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                    {item.transaction_date.slice(8, 10)}일
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">
                    {item.parent_category} &gt; {item.child_category}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{item.summary}</h4>
                <p className="text-[8px] text-slate-500">사용처: {item.vendor || '-'}</p>
              </div>

              <div className="text-right shrink-0">
                {item.income > 0 ? (
                  <span className="text-xs font-bold text-emerald-400">+{formatKrw(item.income)}</span>
                ) : (
                  <span className="text-xs font-bold text-rose-400">-{formatKrw(item.expense)}</span>
                )}
                <span className="text-[9px] text-slate-500 block mt-0.5">잔액 {formatKrw(item.balance)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 이월금 모달 */}
      {showCarryOverModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass w-full max-w-sm rounded-2xl p-5 space-y-4 border border-slate-700/50">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white">기초 이월금 설정 ({yearMonth})</h3>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-400">그룹의 기초 이월금(이전 잔액)을 설정합니다.</p>
              <input
                type="number"
                value={carryOverInput}
                onChange={(e) => setCarryOverInput(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-church-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowCarryOverModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-xs font-bold"
              >
                취소
              </button>
              <button
                onClick={handleSetCarryOver}
                disabled={settingCarryOver}
                className="bg-church-500 hover:bg-church-400 text-slate-950 py-2 rounded-xl text-xs font-bold"
              >
                {settingCarryOver ? '설정 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
