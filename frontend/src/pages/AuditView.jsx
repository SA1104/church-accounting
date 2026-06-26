import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  ShieldAlert, ListFilter, Activity, Calendar, Search, RefreshCw, 
  Grid, FileText, Image as ImageIcon, CheckCircle2, AlertTriangle, Clock, 
  Loader2, Maximize2, Download, User, Tag, ShieldCheck, DollarSign
} from 'lucide-react';

export default function AuditView() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Mode: 'logs' | 'gallery'
  const [mode, setMode] = useState('logs');

  // Common Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchText, setSearchText] = useState('');

  // Logs Mode Filter states
  const [filterAction, setFilterAction] = useState('');
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Gallery Mode Filter/Lists states
  const [receipts, setReceipts] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Combined Modal Details state
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [modalVoucher, setModalVoucher] = useState(null);
  const [modalVoucherLogs, setModalVoucherLogs] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch initial lists (Organizations & Categories)
  useEffect(() => {
    if (token) {
      fetchOrganizations();
      fetchCategories();
    }
  }, [token]);

  // Handle list changes depending on active mode
  useEffect(() => {
    if (mode === 'logs') {
      fetchLogs();
    } else {
      fetchReceipts();
    }
  }, [token, mode, filterAction, selectedOrgId, selectedCatId]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setOrganizations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setCategories(data.filter(c => c.type === 'EXPENSE'));
      } else {
        console.error('Failed to fetch categories:', data.message || 'Unknown error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      let queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (filterAction) queryParams.append('action', filterAction);
      if (searchText) queryParams.append('search', searchText);

      const response = await fetch(`/api/logs?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      console.error('Fetch logs error:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchReceipts = async () => {
    setGalleryLoading(true);
    try {
      let queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (selectedOrgId) queryParams.append('organizationId', selectedOrgId);
      if (selectedCatId) queryParams.append('categoryId', selectedCatId);
      if (minAmount) queryParams.append('minAmount', minAmount);
      if (maxAmount) queryParams.append('maxAmount', maxAmount);
      if (searchText) queryParams.append('search', searchText);

      const response = await fetch(`/api/vouchers/auditor/attachments?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setReceipts(data);
    } catch (err) {
      console.error('Fetch auditor receipts error:', err);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (mode === 'logs') {
      fetchLogs();
    } else {
      fetchReceipts();
    }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSearchText('');
    setFilterAction('');
    setSelectedOrgId('');
    setSelectedCatId('');
    setMinAmount('');
    setMaxAmount('');
    setTimeout(() => {
      if (mode === 'logs') {
        fetchLogs();
      } else {
        fetchReceipts();
      }
    }, 50);
  };

  // Open combined screen details modal
  const handleOpenReceiptModal = async (receipt) => {
    setSelectedReceipt(receipt);
    setModalLoading(true);
    try {
      // 1. Fetch Voucher Detail (includes attachments & history)
      const vResponse = await fetch(`/api/vouchers/${receipt.voucher_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const vData = await vResponse.json();
      setModalVoucher(vData);

      // 2. Fetch specific logs relating to this Voucher
      const lResponse = await fetch(`/api/logs?search=전표 ID: ${receipt.voucher_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const lData = await lResponse.json();
      setModalVoucherLogs(lData);
    } catch (err) {
      console.error('Error fetching combined audit details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const getActionBadgeClass = (action) => {
    if (action.includes('CREATE')) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (action.includes('UPDATE')) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    if (action.includes('DELETE')) return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    if (action.includes('CANCEL') || action.includes('REJECT')) return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    if (action.includes('APPROVE')) return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    if (action.includes('LOCK')) return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    if (action.includes('BACKUP') || action.includes('RESTORE')) return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    return 'bg-slate-800 text-slate-400 border border-slate-700/50';
  };

  const formatRole = (role) => {
    switch (role) {
      case 'SYSTEM_ADMIN': return '시스템 관리자';
      case 'FINANCE_MANAGER': return '재정부장';
      case 'DEPARTMENT_HEAD': return '위원회/부서장';
      case 'DEPARTMENT_ACCOUNTANT': return '부서 회계';
      case 'AUDITOR': return '감사';
      case 'GENERAL_USER': return '일반 사용자';
      default: return role;
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto pb-16">
      {/* 타이틀 및 모드 스위처 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
            <ShieldAlert size={16} className="text-rose-400" /> 재정 감사 통제 센터
          </h2>
          <span className="text-[10px] text-slate-400 font-medium">
            {mode === 'logs' ? `로그 조회: ${logs.length}건` : `영수증 건수: ${receipts.length}건`}
          </span>
        </div>

        {/* 탭 버튼 */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setMode('logs')}
            className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${mode === 'logs' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <FileText size={14} /> 감사 추적 로그
          </button>
          <button
            onClick={() => setMode('gallery')}
            className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${mode === 'gallery' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ImageIcon size={14} /> 영수증 탐색기 (갤러리)
          </button>
        </div>
      </div>

      {/* 필터 툴바 */}
      <form onSubmit={handleSearchSubmit} className="glass p-3.5 rounded-2xl space-y-3 border border-slate-800">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 flex items-center gap-0.5">
              <Calendar size={10} /> 시작일
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 flex items-center gap-0.5">
              <Calendar size={10} /> 종료일
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {mode === 'logs' ? (
          /* 로그 모드 필터 */
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 flex items-center gap-0.5">
                <ListFilter size={10} /> 감사 행위
              </span>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="">전체 로그</option>
                <option value="CREATE_VOUCHER">전표 생성 (CREATE)</option>
                <option value="UPDATE_VOUCHER">전표 수정 (UPDATE)</option>
                <option value="DELETE_VOUCHER">전표 삭제 (DELETE)</option>
                <option value="CANCEL_VOUCHER">전표 회수 (CANCEL)</option>
                <option value="APPROVAL_APPROVE">결재 승인 (APPROVE)</option>
                <option value="APPROVAL_REJECT">결재 반려 (REJECT)</option>
                <option value="LOCK_PERIOD">결산 마감 (LOCK)</option>
                <option value="UNLOCK_PERIOD">마감 해제 (UNLOCK)</option>
                <option value="BACKUP_SYSTEM">시스템 백업 (BACKUP)</option>
                <option value="RESTORE_SYSTEM">시스템 복원 (RESTORE)</option>
                <option value="APPROVE_USER">사용자 승인 (APPROVE_USER)</option>
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 flex items-center gap-0.5">
                <Search size={10} /> 키워드 검색
              </span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="이름, ID, 세부내용..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-2 pr-7 py-1.5 text-xs text-white focus:outline-none placeholder:text-slate-600 font-medium"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  <Search size={11} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 갤러리 모드 필터 */
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500">조직 (위원회/그룹)</span>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="">전체 조직</option>
                  {organizations.map(org => (
                    <option key={org.organization_id} value={org.organization_id}>{org.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500">계정과목 (지출)</span>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="">전체 과목</option>
                  {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>[{cat.parent_category}] {cat.child_category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500">최소 금액</span>
                  <input
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500">최대 금액</span>
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="무제한"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500">통합 검색 (가맹점, 태그, 기안자)</span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="상호, 태그, 작성자 검색..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-2 pr-7 py-1.5 text-xs text-white focus:outline-none placeholder:text-slate-600 font-medium"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    <Search size={11} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 border border-slate-700/30"
          >
            <RefreshCw size={10} /> 필터 초기화
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 bg-church-500 hover:bg-church-600 text-slate-950 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95"
          >
            검색 실행
          </button>
        </div>
      </form>

      {/* 목록 / 갤러리 그리드 바인딩 */}
      {mode === 'logs' ? (
        /* 감사 추적 로그 리스트 */
        <div className="space-y-2">
          {logsLoading ? (
            <div className="text-center text-xs text-slate-500 py-12 flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-church-400" size={18} />
              <span>감사 추적 데이터를 불러오는 중...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="glass p-12 text-center text-xs text-slate-500 rounded-2xl border border-slate-800/40">
              일치하는 로그가 존재하지 않습니다.
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.log_id} 
                className="glass p-3 rounded-2xl space-y-2.5 border border-slate-800/40 relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {log.user_name || '시스템'} ({log.username || 'system'})
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium">
                    {new Date(log.created_at).toLocaleString('ko-KR', { hour12: false, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/40 flex items-start gap-2">
                  <Activity size={12} className="text-church-400 shrink-0 mt-0.5" />
                  <span className="font-medium break-all leading-relaxed text-[11px]">{log.details}</span>
                </div>

                <div className="flex justify-between items-center text-[9px] text-slate-500 px-1">
                  <span>IP: {log.ip_address || '127.0.0.1'}</span>
                  <div className="flex items-center gap-2">
                    {log.target_id && !log.action.includes('DELETE') && (
                      <button
                        type="button"
                        onClick={() => navigate(`/vouchers/${log.target_id}`)}
                        className="px-2 py-0.5 bg-church-600/30 hover:bg-church-600/50 text-church-400 border border-church-500/20 rounded font-bold transition-all text-[8px]"
                      >
                        전표상세 ➔
                      </button>
                    )}
                    <span className="font-semibold text-slate-400">
                      {formatRole(log.user_role || 'SYSTEM')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* 영수증 갤러리 탐색기 그리드 */
        <div className="space-y-4">
          {galleryLoading ? (
            <div className="text-center text-xs text-slate-500 py-12 flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-church-400" size={18} />
              <span>영수증 갤러리 데이터를 불러오는 중...</span>
            </div>
          ) : receipts.length === 0 ? (
            <div className="glass p-12 text-center text-xs text-slate-500 rounded-2xl border border-slate-800/40">
              해당하는 영수증 사진이 존재하지 않습니다.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {receipts.map((rec) => (
                <div 
                  key={rec.attachment_id}
                  onClick={() => handleOpenReceiptModal(rec)}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-church-500/50 transition-all flex flex-col shadow relative group"
                >
                  {/* 영수증 썸네일 */}
                  <div className="aspect-square bg-slate-950 flex items-center justify-center relative">
                    <img src={rec.url} className="w-full h-full object-cover" alt="영수증 썸네일" />
                    
                    {/* OCR 상태 오버레이 */}
                    <div className="absolute top-1 left-1">
                      {rec.ocr_status === 'COMPLETED' ? (
                        <span className="bg-emerald-500 p-0.5 rounded-full block shadow" title="AI 파싱 완료">
                          <CheckCircle2 size={8} className="text-slate-950" />
                        </span>
                      ) : rec.ocr_status === 'PROCESSING' ? (
                        <span className="bg-blue-500 p-0.5 rounded-full block shadow animate-spin" title="AI 파싱 중">
                          <Loader2 size={8} className="text-white" />
                        </span>
                      ) : rec.ocr_status === 'FAILED' ? (
                        <span className="bg-rose-500 p-0.5 rounded-full block shadow" title="AI 파싱 실패">
                          <AlertTriangle size={8} className="text-white" />
                        </span>
                      ) : (
                        <span className="bg-slate-600 p-0.5 rounded-full block shadow" title="대기 중">
                          <Clock size={8} className="text-white" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 텍스트 내용 */}
                  <div className="p-1.5 flex flex-col justify-between flex-grow text-[9px] gap-0.5">
                    <span className="text-slate-300 font-bold truncate block">{rec.voucher_vendor || '가맹점 식별 불가'}</span>
                    <span className="text-slate-400 font-bold block">
                      {rec.amount.toLocaleString()}원
                    </span>
                    <span className="text-slate-500 text-[8px] block font-mono truncate">{rec.transaction_date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 원스크린 감사용 통합 상세 모달 */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-church-400" size={18} />
                <h3 className="text-xs font-bold text-white">전표 통합 감사 뷰어 (영수증 ID: #{selectedReceipt.attachment_id})</h3>
              </div>
              <button 
                onClick={() => { setSelectedReceipt(null); setModalVoucher(null); setModalVoucherLogs([]); }}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full p-1.5 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* 모달 바디 (양방향 분할 스플릿뷰) */}
            <div className="flex-grow overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 왼쪽: 영수증 이미지 & OCR 텍스트 분석 */}
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden aspect-[4/3] relative flex items-center justify-center">
                  <img src={selectedReceipt.url} className="h-full object-contain" alt="영수증" />
                  <a 
                    href={selectedReceipt.url}
                    download
                    className="absolute bottom-3 right-3 bg-slate-900/90 border border-slate-700/50 hover:bg-slate-800 text-white rounded-full p-2.5 transition-all shadow"
                    title="이미지 파일 다운로드"
                  >
                    <Download size={15} />
                  </a>
                </div>

                {/* AI / OCR 결과 분석 박스 */}
                <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-bold text-church-400 uppercase tracking-wider flex items-center gap-1">
                      <Tag size={12} /> AI 분석 결과 및 태그
                    </span>
                    <span className="text-[9px] text-slate-500">인식 신뢰도: {selectedReceipt.ocr_confidence || 0}%</span>
                  </div>

                  {selectedReceipt.ocr_status === 'COMPLETED' ? (
                    <div className="space-y-3.5 text-[10px]">
                      {/* 추천 태그 */}
                      {selectedReceipt.tags && (
                        <div className="flex flex-wrap gap-1">
                          {selectedReceipt.tags.split(',').map((tag, tIdx) => (
                            <span key={tIdx} className="bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-medium">
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 추출 내역 */}
                      <div className="grid grid-cols-2 gap-3 text-slate-300">
                        <div>
                          <span className="text-slate-500 block text-[8px]">추출 가맹점</span>
                          <span className="font-bold">{selectedReceipt.ocr_result?.vendor || '식별불가'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[8px]">추출 금액</span>
                          <span className="font-bold">{(selectedReceipt.ocr_result?.amount || 0).toLocaleString()}원</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[8px]">사업자번호</span>
                          <span className="font-mono">{selectedReceipt.ocr_result?.business_number || '없음'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[8px]">카드승인번호</span>
                          <span className="font-mono">{selectedReceipt.ocr_result?.approval_number || '없음'}</span>
                        </div>
                      </div>

                      {/* OCR 날것의 텍스트 */}
                      {selectedReceipt.ocr_raw_result && (
                        <div className="space-y-1">
                          <span className="text-slate-500 block text-[8px]">영수증 원시 텍스트 (OCR Raw Text)</span>
                          <pre className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[9px] text-slate-400 font-mono max-h-24 overflow-y-auto whitespace-pre-wrap leading-tight">
                            {selectedReceipt.ocr_raw_result}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 py-3 text-center">
                      {selectedReceipt.ocr_status === 'PROCESSING' && 'AI 분석이 현재 백그라운드에서 진행되고 있습니다...'}
                      {selectedReceipt.ocr_status === 'PENDING' && 'AI 분석 대기열에 등록되어 있습니다.'}
                      {selectedReceipt.ocr_status === 'FAILED' && `AI 분석에 실패하였습니다. (에러: ${selectedReceipt.ocr_error || '알 수 없음'})`}
                    </div>
                  )}
                </div>
              </div>

              {/* 오른쪽: 전표 상세, 결재이력, 감사로그 타임라인 */}
              <div className="space-y-4 overflow-y-auto max-h-[60vh] md:max-h-none pr-1">
                {modalLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-2">
                    <Loader2 className="animate-spin text-church-400" size={24} />
                    <span className="text-xs text-slate-500">전표 및 이력 데이터 통합 로딩 중...</span>
                  </div>
                ) : modalVoucher ? (
                  <>
                    {/* 1. 전표 상세 내역 */}
                    <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-3.5">
                      <div className="flex justify-between items-start border-b border-slate-800/80 pb-2.5">
                        <div>
                          <h4 className="text-xs font-bold text-white leading-snug">{modalVoucher.summary}</h4>
                          <span className="text-[9px] text-slate-400 block mt-0.5">전표번호 #{modalVoucher.voucher_id} · {modalVoucher.writer_name} 작성</span>
                        </div>
                        <span className="text-xs font-bold text-white">{modalVoucher.amount.toLocaleString()}원</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-church-400 shrink-0" />
                          <span>거래일자: {modalVoucher.transaction_date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck size={12} className="text-church-400 shrink-0" />
                          <span className="truncate">계정과목: {modalVoucher.child_category}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign size={12} className="text-church-400 shrink-0" />
                          <span>결제수단: {modalVoucher.payment_method === 'CARD' ? '카드' : modalVoucher.payment_method === 'BANK_TRANSFER' ? '이체' : '현금'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-church-400 shrink-0" />
                          <span className="truncate">소속: {modalVoucher.group_name}</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. 결재 타임라인 및 디지털 서명 */}
                    <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-3">
                      <h4 className="text-[10px] font-bold text-church-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                        <Clock size={12} /> 전자 결재 이력
                      </h4>

                      <div className="space-y-3 pl-3.5 relative before:content-[''] before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-800">
                        {modalVoucher.histories?.length === 0 ? (
                          <div className="text-[9px] text-slate-500">이력이 존재하지 않습니다.</div>
                        ) : (
                          modalVoucher.histories?.map(h => (
                            <div key={h.history_id} className="relative text-[10px]">
                              <div className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950" />
                              <div className="flex justify-between font-bold text-slate-300">
                                <span>{h.actor_name} ({h.actor_position})</span>
                                <span className="text-[8px] text-slate-500">{new Date(h.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="text-[9px] text-slate-400 mt-0.5 flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-800/40">
                                <span>{h.comment || h.action}</span>
                                {h.signature && (
                                  <span className="border border-emerald-500/60 text-emerald-400 font-bold px-1 rounded text-[7px] rotate-[-2deg] bg-emerald-500/5 select-none font-mono">
                                    {h.signature}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 3. 감사 로그 추적 (이 전표와 관련된 생성/수정/결재 행위 전체 아카이브) */}
                    <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-3">
                      <h4 className="text-[10px] font-bold text-church-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                        <Activity size={12} /> 관련 감사 추적 로그
                      </h4>

                      <div className="space-y-2">
                        {modalVoucherLogs.length === 0 ? (
                          <div className="text-[9px] text-slate-500 py-1">감사 추적 로그 매칭 결과가 없습니다.</div>
                        ) : (
                          modalVoucherLogs.map(log => (
                            <div key={log.log_id} className="bg-slate-950 border border-slate-900 p-2 rounded-lg text-[9px] text-slate-400 space-y-1">
                              <div className="flex justify-between items-center text-[8px] text-slate-500">
                                <span className="font-bold text-slate-400">{log.user_name || '시스템'} ({formatRole(log.user_role)})</span>
                                <span>{new Date(log.created_at).toLocaleString()}</span>
                              </div>
                              <p className="leading-snug text-slate-300">{log.details}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] text-slate-500 py-10 text-center">전표 정보를 로드할 수 없습니다.</div>
                )}
              </div>

            </div>

            {/* 모달 하단 컨트롤 */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center text-xs">
              <span className="text-[10px] text-slate-500">본 정보는 재정 감사위원회 감사 전용으로 외부 유출을 금지합니다.</span>
              <div className="flex gap-2">
                {modalVoucher && (
                  <button
                    onClick={() => { setSelectedReceipt(null); navigate(`/vouchers/${modalVoucher.voucher_id}`); }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl shadow transition-all border border-slate-750"
                  >
                    상세화면으로 이동 ➔
                  </button>
                )}
                <button
                  onClick={() => { setSelectedReceipt(null); setModalVoucher(null); setModalVoucherLogs([]); }}
                  className="bg-church-500 hover:bg-church-600 text-slate-950 font-bold py-2 px-4 rounded-xl shadow transition-all"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
