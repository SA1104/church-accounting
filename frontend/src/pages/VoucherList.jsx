import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../App';
import { Filter, ChevronRight, FileX, CheckSquare, Square, Check, X, Send } from 'lucide-react';

export default function VoucherList() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [vouchers, setVouchers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // 필터 조건들
  const [selectedGroup, setSelectedGroup] = useState(searchParams.get('group') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // 일괄 선택 및 모달 상태
  const [selectedIds, setSelectedIds] = useState([]);
  const [approvers, setApprovers] = useState({ deptHeads: [], financeTeams: [] });
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [deptHeadId, setDeptHeadId] = useState('');
  const [financeId, setFinanceId] = useState('');
  const [comment, setComment] = useState('');
  const [signature, setSignature] = useState(`${user.name} (${user.position}) (인)`);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchVouchers();
    fetchApprovers();
  }, [token, selectedGroup, selectedStatus, selectedType, startDate, endDate]);

  // 전표 목록 캐싱 처리
  useEffect(() => {
    if (Array.isArray(vouchers) && vouchers.length > 0) {
      const ids = vouchers.map(v => v.voucher_id);
      localStorage.setItem('filteredVoucherIds', JSON.stringify(ids));
    } else {
      localStorage.removeItem('filteredVoucherIds');
    }
  }, [vouchers]);

  const fetchGroups = async () => {
    if (user.role === 'AUDITOR' || user.role === 'SYSTEM_ADMIN') {
      try {
        const response = await fetch('/api/groups', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setGroups(data);
      } catch (err) {
        console.error('Fetch groups error:', err);
      }
    }
  };

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      let url = '/api/vouchers?';
      if (selectedGroup) url += `group=${selectedGroup}&`;
      if (selectedStatus) url += `status=${selectedStatus}&`;
      if (selectedType) url += `type=${selectedType}&`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setVouchers(data);
        setSelectedIds([]); // 필터 변경 시 선택 초기화
      } else {
        console.error('Fetch vouchers failed:', data?.message);
        setVouchers([]);
      }
    } catch (err) {
      console.error('Fetch vouchers error:', err);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovers = async () => {
    try {
      const response = await fetch('/api/users/approvers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setApprovers(data);
        // localStorage에 선호 정보가 있는지 확인
        const prefDept = localStorage.getItem('pref_dept_head_approver_id');
        const prefFin = localStorage.getItem('pref_finance_approver_id');
        if (prefDept) setDeptHeadId(prefDept);
        else if (data.deptHeads.length > 0) setDeptHeadId(data.deptHeads[0].user_id.toString());
        if (prefFin) setFinanceId(prefFin);
        else if (data.financeTeams.length > 0) setFinanceId(data.financeTeams[0].user_id.toString());
      }
    } catch (err) {
      console.error('Fetch approvers candidate error:', err);
    }
  };

  const handleCheckboxChange = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === vouchers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(vouchers.map(v => v.voucher_id));
    }
  };

  // 일괄 상신 처리 구동
  const handleBatchSubmit = async () => {
    if (!deptHeadId || !financeId) {
      alert('1차 및 최종 결재자를 선택해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/vouchers/batch-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          voucherIds: selectedIds,
          dept_head_approver_id: parseInt(deptHeadId, 10),
          finance_approver_id: parseInt(financeId, 10)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      alert(data.message);
      setShowSubmitModal(false);
      setSelectedIds([]);
      fetchVouchers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 일괄 결재 처리 구동
  const handleBatchApprove = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/approvals/batch-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType: 'VOUCHER',
          targetIds: selectedIds,
          action: 'APPROVE',
          comment,
          signature
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      alert(data.message);
      setShowApproveModal(false);
      setComment('');
      setSelectedIds([]);
      fetchVouchers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatKrw = (amount) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'REJECTED': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'TEMP': return 'bg-slate-800 text-slate-400 border border-slate-700/50';
      case 'SUBMITTED': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'DEPT_APPROVED': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'APPROVED': return '최종승인';
      case 'REJECTED': return '반려됨';
      case 'TEMP': return '임시저장';
      case 'SUBMITTED': return '1차결재중';
      case 'DEPT_APPROVED': return '최종결재중';
      default: return status;
    }
  };

  // 일괄 상신 가능 여부
  const canBatchSubmit = selectedIds.length > 0 && selectedIds.every(id => {
    const v = vouchers.find(x => x.voucher_id === id);
    return v && (v.status === 'TEMP' || v.status === 'REJECTED') && v.writer_id === user.userId;
  });

  // 일괄 승인 가능 여부
  const canBatchApprove = selectedIds.length > 0 && selectedIds.every(id => {
    const v = vouchers.find(x => x.voucher_id === id);
    if (!v) return false;
    if (v.status === 'SUBMITTED' && v.dept_head_approver_id === user.userId) return true;
    if (v.status === 'DEPT_APPROVED' && v.finance_approver_id === user.userId) return true;
    if (user.role === 'SYSTEM_ADMIN' && (v.status === 'SUBMITTED' || v.status === 'DEPT_APPROVED')) return true;
    return false;
  });

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {vouchers.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-slate-400 hover:text-white p-1"
              title="전체 선택/해제"
            >
              {selectedIds.length === vouchers.length ? <CheckSquare size={18} className="text-church-400" /> : <Square size={18} />}
            </button>
          )}
          <h2 className="text-sm font-bold text-slate-300">전표 결재 관리 목록 ({selectedIds.length}/{vouchers.length})</h2>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            showFilters ? 'bg-church-600/30 border-church-500 text-church-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Filter size={13} /> 상세 검색 필터
        </button>
      </div>

      {/* 일괄 액션 플로팅 툴바 */}
      {selectedIds.length > 0 && (
        <div className="glass p-3 rounded-2xl border border-church-500/30 bg-church-950/20 flex items-center justify-between animate-fadeIn shadow-lg animate-pulse-subtle">
          <span className="text-[11px] font-bold text-slate-300">선택된 항목: {selectedIds.length}건</span>
          <div className="flex gap-2">
            {canBatchSubmit && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="bg-church-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 hover:bg-church-550 transition-all"
              >
                <Send size={12} /> 선택 일괄 상신
              </button>
            )}
            {canBatchApprove && (
              <button
                onClick={() => setShowApproveModal(true)}
                className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 hover:bg-emerald-400 transition-all"
              >
                <Check size={12} /> 선택 일괄 승인
              </button>
            )}
            {!canBatchSubmit && !canBatchApprove && (
              <span className="text-[9px] text-slate-500 self-center">일괄 작업을 하려면 상태가 같은 문서를 선택하세요.</span>
            )}
          </div>
        </div>
      )}

      {showFilters && (
        <div className="glass p-4 rounded-2xl space-y-3.5 animate-fadeIn">
          {/* 그룹 필터 */}
          {(user.role === 'AUDITOR' || user.role === 'SYSTEM_ADMIN') && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">조회 찬양팀/소속그룹</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">전체 찬양팀/그룹</option>
                {groups.map(g => (
                  <option key={g.group_id} value={g.group_id}>[{g.organization_name}] {g.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">결재 상태</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">전체 상태</option>
                <option value="TEMP">임시저장</option>
                <option value="SUBMITTED">1차결재중</option>
                <option value="DEPT_APPROVED">최종결재중</option>
                <option value="APPROVED">최종승인</option>
                <option value="REJECTED">반려됨</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">구분</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">전체 구분</option>
                <option value="EXPENSE">지출</option>
                <option value="INCOME">수입</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* 카드형 리스트 */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center text-xs text-slate-500 py-12">전표 목록을 읽어오는 중...</div>
        ) : vouchers.length === 0 ? (
          <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
            <FileX size={36} className="text-slate-600" />
            <p className="text-xs font-bold">조건에 해당하는 전표가 없습니다.</p>
          </div>
        ) : (
          vouchers.map(v => (
            <div key={v.voucher_id} className="flex items-center gap-2 w-full">
              <input
                type="checkbox"
                checked={selectedIds.includes(v.voucher_id)}
                onChange={(e) => handleCheckboxChange(v.voucher_id, e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-850 bg-slate-950 text-church-500 focus:ring-church-500 focus:ring-offset-0 focus:ring-0 shrink-0 cursor-pointer"
              />
              <div
                onClick={() => navigate(`/vouchers/${v.voucher_id}`)}
                className="glass p-3.5 rounded-2xl flex items-center justify-between active:bg-slate-900/80 transition-all cursor-pointer border border-slate-800/40 relative overflow-hidden flex-1 min-w-0"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${v.transaction_type === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                <div className="pl-1.5 space-y-1 flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-slate-400">[{v.organization_name}] {v.group_name}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="text-[9px] font-bold text-slate-400">{v.writer_name}</span>
                  </div>
                  <h3 className="text-xs font-bold text-white truncate">{v.summary}</h3>
                  <div className="flex items-center gap-2 text-[9px] text-slate-500 font-medium">
                    <span className="font-semibold">{v.transaction_date}</span>
                    <span>·</span>
                    <span>{v.parent_category} &gt; {v.child_category}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">{formatKrw(v.amount)}</span>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeClass(v.status)}`}>
                    {getStatusText(v.status)}
                  </span>
                </div>

                <ChevronRight size={14} className="text-slate-600 shrink-0 ml-1.5" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* 일괄 상신 지정 모달 */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass w-full max-w-sm rounded-2xl p-5 space-y-4 border border-slate-700/50">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white">선택 전표 일괄 상신 결재선 지정</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5">
              <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                선택된 {selectedIds.length}건의 전표를 일괄 상신합니다. 결재 라인을 지정해 주십시오.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">1차 결재자 (부서장) *</label>
                <select
                  value={deptHeadId}
                  onChange={(e) => setDeptHeadId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {approvers.deptHeads.map(h => (
                    <option key={h.user_id} value={h.user_id}>{h.name} ({h.position})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">최종 결재자 (회계팀장) *</label>
                <select
                  value={financeId}
                  onChange={(e) => setFinanceId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {approvers.financeTeams.map(t => (
                    <option key={t.user_id} value={t.user_id}>{t.name} ({t.position})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-bold"
              >
                취소
              </button>
              <button
                onClick={handleBatchSubmit}
                disabled={submitting}
                className="bg-church-600 hover:bg-church-550 text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {submitting ? '상신 중...' : '일괄 상신하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일괄 승인 확인 모달 */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass w-full max-w-sm rounded-2xl p-5 space-y-4 border border-slate-700/50">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white">선택 전표 일괄 결재 승인</h3>
              <button onClick={() => setShowApproveModal(false)} className="text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5">
              <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                선택된 {selectedIds.length}건의 전표를 승인합니다. 서명 및 일괄 코멘트를 입력해 주십시오.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">디지털 인장 서명 문구 *</label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="예: 홍길동 (인)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-church-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">일괄 승인 의견 (선택)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="일괄 승인 시 기록할 메모가 있으면 입력하세요."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-bold"
              >
                취소
              </button>
              <button
                onClick={handleBatchApprove}
                disabled={submitting}
                className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {submitting ? '승인 중...' : '일괄 승인하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
