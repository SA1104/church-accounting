import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../App';
import { TrendingUp, TrendingDown, Clock, AlertTriangle, XOctagon, Plus, ChevronRight, Users, RefreshCw, FileText, Activity, Cpu } from 'lucide-react';

export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Workspace Profile State
  const [churchProfile, setChurchProfile] = useState({
    church_name: '신길교회',
    denomination: '기독교대한성결교회',
    logo_url: '/church_logo.png'
  });

  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/church/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setChurchProfile(data);
        }
      } catch (err) {
        console.error('Error fetching church profile:', err);
      }
    };
    fetchProfile();
  }, [token]);

  const renderWorkspaceBranding = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-slate-900/40 rounded-2xl border border-slate-800/85 mb-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 flex items-center justify-center p-1 rounded-xl bg-white border border-slate-700/30 overflow-hidden shrink-0">
          <img src={churchProfile.logo_url} alt={churchProfile.church_name} className="h-full w-auto object-contain" />
        </div>
        <div>
          <h2 className="text-xs font-bold text-white leading-normal">{churchProfile.church_name}</h2>
          <p className="text-[8.5px] text-slate-500 font-bold tracking-wider">{churchProfile.denomination}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* 회계/전표등록 */}
        <button
          onClick={() => navigate('/vouchers/new')}
          disabled={user?.role === 'AUDITOR'}
          title={user?.role === 'AUDITOR' ? '감사위원은 전표 등록 권한이 없습니다.' : '신규 전표 등록'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed text-white font-extrabold text-[9px] sm:text-[10px] transition active:scale-95 shadow-sm"
        >
          <Plus size={11} />
          <span>회계/전표등록</span>
        </button>

        {/* 전표목록 */}
        <button
          onClick={() => navigate('/vouchers')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-100 font-extrabold text-[9px] sm:text-[10px] transition active:scale-95 shadow-sm"
        >
          <FileText size={11} className="text-slate-400" />
          <span>전표목록</span>
        </button>
      </div>
    </div>
  );

  const renderAiSummaryCard = () => (
    <div className="glass p-4.5 rounded-2xl border border-indigo-500/25 bg-indigo-950/15 backdrop-blur-md relative overflow-hidden mb-4">
      <div className="absolute -right-10 -top-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
      
      {/* Title */}
      <div className="flex items-center justify-between mb-3 border-b border-indigo-950/40 pb-2">
        <div className="flex items-center gap-2 text-indigo-400">
          <Cpu size={14} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Decision Home</span>
        </div>
        <span className="text-[8px] bg-indigo-500/20 text-indigo-300 font-extrabold px-2 py-0.5 rounded border border-indigo-500/30">
          의사결정 보드
        </span>
      </div>

      {/* Decision Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5 text-center font-mono">
        <div className="p-2 bg-slate-950/40 border border-slate-900/60 rounded-xl">
          <span className="text-[8px] text-slate-500 block mb-0.5">오늘 생성됨</span>
          <span className="text-xs font-bold text-white">1건</span>
        </div>
        <div className="p-2 bg-slate-950/40 border border-slate-900/60 rounded-xl">
          <span className="text-[8px] text-slate-500 block mb-0.5">승인 대기</span>
          <span className="text-xs font-bold text-amber-400">2건</span>
        </div>
        <div className="p-2 bg-slate-950/40 border border-slate-900/60 rounded-xl">
          <span className="text-[8px] text-slate-500 block mb-0.5">위험도(High)</span>
          <span className="text-xs font-bold text-rose-400">0건</span>
        </div>
        <div className="p-2 bg-slate-950/40 border border-slate-900/60 rounded-xl">
          <span className="text-[8px] text-slate-500 block mb-0.5">최근 학습됨</span>
          <span className="text-xs font-bold text-emerald-400">3건</span>
        </div>
      </div>

      {/* AI Summary Statement */}
      <p className="text-[10.5px] text-slate-300 leading-relaxed font-semibold mb-3">
        신길교회 6월 재정 상황 분석 결과: 일반회계 수입이 전월 대비 4.2% 증가하였으나 중등부 지출이 예산 대비 12% 초과 집행되었습니다. 총 1건의 보정 의사결정이 필요합니다.
      </p>

      {/* Suggested Actions */}
      <div className="space-y-1.5 pt-2.5 border-t border-slate-900 text-[9px] font-bold">
        <div className="flex items-center gap-1.5 text-amber-400">
          <span>⚠️</span>
          <span>중등부 행사 예산 증액 및 초과금 승인 의사결정 권장</span>
        </div>
        <div className="flex items-center gap-1.5 text-sky-400">
          <span>📝</span>
          <span>결재 대기 중인 교육부 전표 3건 일괄 검토 의사결정</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span>📊</span>
          <span>당월 결산 보고서 피드백을 통한 의사결정 모델 학습 개시</span>
        </div>
      </div>
    </div>
  );

  const [stats, setStats] = useState({
    income: 0,
    expense: 0,
    balance: 0,
    pendingApprovals: 0,
    rejectedVouchers: 0,
    missingAttachments: 0
  });

  const [recentVouchers, setRecentVouchers] = useState([]);
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin stats state
  const [adminStats, setAdminStats] = useState(null);
  const [activeTab, setActiveTab] = useState(
    user?.role === 'SYSTEM_ADMIN' || user?.role === 'AUDITOR' ? 'admin' : 'user'
  );

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const currentYearMonth = today.toISOString().slice(0, 7);

      // Fetch user specific dashboard data
      const vResponse = await fetch('/api/vouchers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const vouchers = await vResponse.json();

      const aResponse = await fetch('/api/approvals/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pendingData = await aResponse.json();

      const gResponse = await fetch('/api/groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const groups = await gResponse.json();

      const vouchersList = (vResponse.ok && Array.isArray(vouchers)) ? vouchers : [];
      const pendingObj = (aResponse.ok && pendingData) ? pendingData : { vouchers: [], ledgers: [], reports: [] };
      const groupsList = (gResponse.ok && Array.isArray(groups)) ? groups : [];
      let filteredGroups = [];
      if (user?.role === 'SYSTEM_ADMIN' || user?.role === 'AUDITOR') {
        filteredGroups = groupsList;
      } else if (user?.role === 'FINANCE_MANAGER') {
        const myGroup = groupsList.find(g => g.group_id === user.groupId);
        if (myGroup) {
          filteredGroups = groupsList.filter(g => g.organization_id === myGroup.organization_id);
        } else {
          filteredGroups = groupsList.filter(g => g.group_id === user.groupId);
        }
      } else {
        filteredGroups = groupsList.filter(g => g.group_id === user.groupId);
      }

      let income = 0;
      let expense = 0;
      let rejected = 0;
      let missingAttach = 0;

      vouchersList.forEach(v => {
        if (v.transaction_date && v.transaction_date.slice(0, 7) === currentYearMonth && v.status === 'APPROVED') {
          if (v.transaction_type === 'INCOME') income += v.amount;
          if (v.transaction_type === 'EXPENSE') expense += v.amount;
        }
        if (v.status === 'REJECTED') {
          rejected++;
        }
        if (v.status !== 'APPROVED' && !v.has_attachment) {
          missingAttach++;
        }
      });

      const totalPending = (pendingObj.vouchers?.length || 0) + 
                            (pendingObj.ledgers?.length || 0) + 
                            (pendingObj.reports?.length || 0);

      // 소속 그룹별 지출 총액 연산
      const groupSums = filteredGroups.map(g => {
        const gExp = vouchersList
          .filter(v => v.group_id === g.group_id && v.transaction_type === 'EXPENSE' && v.status === 'APPROVED')
          .reduce((sum, v) => sum + v.amount, 0);
        return { name: g.name, amount: gExp };
      });

      const lResponse = await fetch(`/api/ledgers?yearMonth=${currentYearMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ledgerData = await lResponse.json();

      setStats({
        income,
        expense,
        balance: ledgerData?.balance || 0,
        pendingApprovals: totalPending,
        rejectedVouchers: rejected,
        missingAttachments: missingAttach
      });

      setRecentVouchers(vouchersList.slice(0, 4));
      setGroupExpenses(groupSums);

      // Admin stats
      if (user?.role === 'SYSTEM_ADMIN' || user?.role === 'AUDITOR') {
        const statsRes = await fetch('/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setAdminStats(statsData);
        }
      }
    } catch (error) {
      console.error('Fetch dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatKrw = (amount) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-slate-400 text-sm py-20 flex-col gap-2">
        <RefreshCw className="animate-spin text-church-400" size={20} />
        <span>대시보드를 불러오는 중입니다...</span>
      </div>
    );
  }

  // Admin Dashboard View
  if (activeTab === 'admin' && adminStats) {
    return (
      <div className="p-4 space-y-4">
        {/* Workspace Branding & AI Summary first */}
        {renderWorkspaceBranding()}
        {renderAiSummaryCard()}

        {/* Toggle Bar */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
              activeTab === 'admin' 
                ? 'bg-church-500 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            운영 통계 대시보드
          </button>
          <button
            onClick={() => setActiveTab('user')}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
              activeTab === 'user' 
                ? 'bg-church-500 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            개인 전표 현황
          </button>
        </div>

        {/* Welcome Section */}
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-xs font-bold text-slate-300">재정 운영 요약</h2>
            <p className="text-[9px] text-slate-500 mt-0.5">시스템 사용자 관리 및 감사 요약 통계</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg active:scale-95 transition-all"
          >
            <RefreshCw size={12} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            onClick={() => navigate('/settings')}
            className="glass p-3 rounded-2xl border border-slate-800/50 flex flex-col justify-between h-20 cursor-pointer active:scale-95 transition-all"
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-slate-500 font-bold">사용자 현황</span>
              <Users size={14} className="text-sky-400" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block leading-none">{adminStats.totalUsers}명</span>
              <span className="text-[8px] text-slate-400 mt-1 block">가입 승인 대기: {adminStats.pendingUsers}명</span>
            </div>
          </div>

          <div 
            onClick={() => navigate('/vouchers')}
            className="glass p-3 rounded-2xl border border-slate-800/50 flex flex-col justify-between h-20 cursor-pointer active:scale-95 transition-all"
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-slate-500 font-bold">오늘 결재 건수</span>
              <FileText size={14} className="text-amber-400" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block leading-none">상신 {adminStats.todaySubmitted} / 승인 {adminStats.todayApproved}</span>
              <span className="text-[8px] text-slate-400 mt-1 block">금일 승인 처리 현황</span>
            </div>
          </div>

          <div className="glass p-3 rounded-2xl border border-slate-800/50 flex flex-col justify-between h-20 col-span-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-slate-500 font-bold">이번 달 재정 현계 (승인 기준)</span>
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <span className="text-[8px] text-slate-500 block">수입합계</span>
                <span className="text-xs font-semibold text-emerald-400">{formatKrw(adminStats.monthlyIncome)}</span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 block">지출합계</span>
                <span className="text-xs font-semibold text-rose-400">{formatKrw(adminStats.monthlyExpense)}</span>
              </div>
            </div>
          </div>

          <div className="glass p-3 rounded-2xl border border-slate-800/50 flex flex-col justify-between h-20 col-span-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-slate-500 font-bold">다빈도 계정과목</span>
              <Activity size={14} className="text-purple-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block max-w-[280px] truncate">{adminStats.topCategory || '데이터 없음'}</span>
              <span className="text-[8px] text-slate-400 mt-0.5 block">전체 전표에서 가장 높은 사용 빈도</span>
            </div>
          </div>
        </div>

        {/* 부서별 지출 순위 */}
        <div className="glass p-4 rounded-2xl">
          <h3 className="text-xs font-bold text-slate-300 mb-3">부서별 지출 순위 (당월)</h3>
          <div className="space-y-3">
            {adminStats.deptExpenses && adminStats.deptExpenses.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-4">지출 데이터가 없습니다.</p>
            ) : (
              adminStats.deptExpenses?.slice(0, 5).map((g, idx) => {
                const maxVal = Math.max(...adminStats.deptExpenses.map(d => d.total_expense)) || 1;
                const percentage = Math.min(100, Math.round((g.total_expense / maxVal) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-300 font-semibold">{g.group_name}</span>
                      <span className="text-slate-400 font-bold">{formatKrw(g.total_expense)}</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/60">
                      <div 
                        className="bg-gradient-to-r from-church-600 to-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 최근 감사 로그 (감사팀 AUDITOR 권한 전용) */}
        {user?.role === 'AUDITOR' && (
          <div className="glass p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-300">최근 감사 로그</h3>
              <button 
                onClick={() => navigate('/audit')}
                className="text-[10px] text-church-400 font-bold flex items-center"
              >
                전체보기 <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {adminStats.recentLogs && adminStats.recentLogs.length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-2">감사 로그가 없습니다.</p>
              ) : (
                adminStats.recentLogs?.map((log) => (
                  <div key={log.log_id} className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/30 text-[10px] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-300">{log.action}</span>
                      <span className="text-[8px] text-slate-500">
                        {new Date(log.created_at).toLocaleString('ko-KR', { hour12: false, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[9.5px] line-clamp-1 leading-relaxed">{log.details}</p>
                    <div className="text-[8px] text-slate-500 flex justify-between mt-1 pt-1 border-t border-slate-800/40">
                      <span>수행자: {log.user_name || '시스템'}</span>
                      <span>IP: {log.ip_address}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Standard Personal Dashboard View
  return (
    <div className="p-4 space-y-4">
      {/* Workspace Branding & AI Summary first */}
      {renderWorkspaceBranding()}
      {renderAiSummaryCard()}

      {/* Toggle Bar for Admin/Auditor */}
      {(user?.role === 'SYSTEM_ADMIN' || user?.role === 'AUDITOR') && (
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
              activeTab === 'admin' 
                ? 'bg-church-500 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            운영 통계 대시보드
          </button>
          <button
            onClick={() => setActiveTab('user')}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
              activeTab === 'user' 
                ? 'bg-church-500 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            개인 전표 현황
          </button>
        </div>
      )}

      {/* 1. 당월 재정 상황 카드 */}
      <div className="bg-gradient-to-br from-church-800 via-slate-900 to-church-950 p-5 rounded-2xl border border-church-500/20 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-church-500/10 rounded-full blur-2xl" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />

        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-church-300 uppercase tracking-widest">이번 달 재정 현황</span>
          <span className="text-[9px] bg-church-500/20 text-church-400 font-semibold px-2 py-0.5 rounded-full border border-church-500/30">
            실시간
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-slate-400 font-medium">현재 잔액 (통합)</span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {formatKrw(stats.balance)}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400">수입 (당월)</p>
              <p className="text-xs font-semibold text-emerald-400">{formatKrw(stats.income)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <TrendingDown size={16} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400">지출 (당월)</p>
              <p className="text-xs font-semibold text-rose-400">{formatKrw(stats.expense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 결재 위젯 그리드 */}
      <div className="grid grid-cols-3 gap-3">
        <div 
          onClick={() => navigate('/vouchers?status=SUBMITTED')} 
          className="glass p-3 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all"
        >
          <div className={`w-8 h-8 rounded-full ${stats.pendingApprovals > 0 ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-slate-800 text-slate-400'} flex items-center justify-center mb-1.5`}>
            <Clock size={16} />
          </div>
          <span className="text-[9px] text-slate-400 font-medium">결재 대기</span>
          <span className="text-sm font-bold text-white mt-0.5">{stats.pendingApprovals}건</span>
        </div>

        <div 
          onClick={() => navigate('/vouchers?status=REJECTED')} 
          className="glass p-3 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all"
        >
          <div className={`w-8 h-8 rounded-full ${stats.rejectedVouchers > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'} flex items-center justify-center mb-1.5`}>
            <XOctagon size={16} />
          </div>
          <span className="text-[9px] text-slate-400 font-medium">반려 건수</span>
          <span className="text-sm font-bold text-white mt-0.5">{stats.rejectedVouchers}건</span>
        </div>

        <div 
          onClick={() => navigate('/vouchers')} 
          className="glass p-3 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mb-1.5">
            <AlertTriangle size={16} />
          </div>
          <span className="text-[9px] text-slate-400 font-medium">첨부 누락</span>
          <span className="text-sm font-bold text-white mt-0.5">{stats.missingAttachments}건</span>
        </div>
      </div>

      {/* 3. 최근 전표 리스트 */}
      <div className="glass p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-xs font-bold text-slate-300">최근 작성된 전표</h3>
          <button 
            onClick={() => navigate('/vouchers')}
            className="text-[10px] text-church-400 font-medium flex items-center"
          >
            전체보기 <ChevronRight size={12} />
          </button>
        </div>

        <div className="space-y-2.5">
          {recentVouchers.length === 0 ? (
            <p className="text-[11px] text-slate-500 text-center py-4">등록된 전표가 없습니다.</p>
          ) : (
            recentVouchers.map((v) => (
              <div 
                key={v.voucher_id} 
                onClick={() => navigate(`/vouchers/${v.voucher_id}`)}
                className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/40 active:bg-slate-900/80 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${v.transaction_type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {v.transaction_type === 'INCOME' ? '수입' : '지출'}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white max-w-[150px] truncate">{v.summary}</h4>
                    <p className="text-[9px] text-slate-500 mt-0.5">{v.transaction_date} · {v.group_name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-white block">{formatKrw(v.amount)}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                    v.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                    v.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                    v.status === 'TEMP' ? 'bg-slate-800 text-slate-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {v.status === 'APPROVED' && '승인완료'}
                    {v.status === 'REJECTED' && '반려'}
                    {v.status === 'TEMP' && '임시저장'}
                    {v.status === 'SUBMITTED' && '1차결재중'}
                    {v.status === 'DEPT_APPROVED' && '최종결재중'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. 찬양팀/그룹별 지출 현황 바 차트 */}
      <div className="glass p-4 rounded-2xl">
        <h3 className="text-xs font-bold text-slate-300 mb-3.5">찬양팀 및 소속그룹별 지출 현황</h3>
        <div className="space-y-3">
          {groupExpenses.map((g, idx) => {
            const maxVal = Math.max(...groupExpenses.map(d => d.amount)) || 1;
            const percentage = Math.min(100, Math.round((g.amount / maxVal) * 100));
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-300 font-semibold">{g.name}</span>
                  <span className="text-slate-400 font-bold">{formatKrw(g.amount)}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/60">
                  <div 
                    className="bg-gradient-to-r from-church-600 to-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 플로팅 추가 버튼 */}
      {user?.role === 'DEPARTMENT_ACCOUNTANT' && (
        <button
          onClick={() => navigate('/vouchers/new')}
          className="fixed right-4 bottom-16 w-12 h-12 rounded-full bg-gradient-to-tr from-church-600 to-emerald-500 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all z-20"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}

