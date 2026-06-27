import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../App';
import { 
  ArrowLeft, Clock, Calendar, Shield, CreditCard, MessageSquare, 
  Edit, Trash2, Check, X, AlertTriangle, Users, ChevronLeft, ChevronRight,
  Eye, CheckCircle2, Loader2, Sparkles, Download, Maximize2
} from 'lucide-react';

export default function VoucherDetail() {
  const { token, user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 갤러리 상태
  const [activeAttachmentIdx, setActiveAttachmentIdx] = useState(0);
  const [zoomUrl, setZoomUrl] = useState(null); // Lightbox zoom modal url

  // 결재 액션 상태
  const [actionType, setActionType] = useState(null);
  const [comment, setComment] = useState('');
  const [signatureInput, setSignatureInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 결산 마감 상태
  const [periodLocks, setPeriodLocks] = useState([]);
  
  // 상신 취소 모달 상태
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonType, setCancelReasonType] = useState('금액 수정');
  const [cancelReasonDetail, setCancelReasonDetail] = useState('');

  // 좌우 전표 이동 상태
  const [siblingIds, setSiblingIds] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(-1);

  useEffect(() => {
    fetchVoucherDetail();
    fetchPeriodLocks();
  }, [id, token]);

  // SSE 실시간 OCR 상태 업데이트 수신
  useEffect(() => {
    if (!token) return;
    const eventSource = new EventSource(`/api/vouchers/sse?token=${token}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE OCR Update in Detail:', data);

        setVoucher(prev => {
          if (!prev || !prev.attachments) return prev;
          const updatedAttachments = prev.attachments.map(att => {
            if (att.attachment_id && att.attachment_id === data.attachment_id) {
              return {
                ...att,
                ocr_status: data.ocr_status,
                ocr_result: data.ocr_result || att.ocr_result,
                tags: data.tags ? data.tags.join(',') : att.tags
              };
            }
            return att;
          });
          return {
            ...prev,
            attachments: updatedAttachments
          };
        });
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE disconnected, closing EventSource:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [token]);

  // localStorage에서 전표 ID 목록 불러오기
  useEffect(() => {
    try {
      const cached = localStorage.getItem('filteredVoucherIds');
      if (cached) {
        const ids = JSON.parse(cached).map(x => parseInt(x, 10));
        setSiblingIds(ids);
        const idx = ids.indexOf(parseInt(id, 10));
        setCurrentIdx(idx);
      }
    } catch (e) {
      console.error('Error loading sibling IDs:', e);
    }
  }, [id]);

  const navigateToSibling = (direction) => {
    if (currentIdx === -1 || siblingIds.length === 0) return;
    const nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx >= 0 && nextIdx < siblingIds.length) {
      navigate(`/vouchers/${siblingIds[nextIdx]}`);
    }
  };

  // 키보드 좌우 방향키 단축키 바인딩
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        navigateToSibling('prev');
      } else if (e.key === 'ArrowRight') {
        navigateToSibling('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, siblingIds]);

  const fetchVoucherDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vouchers/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setVoucher(data);
      if (data.attachments && data.attachments.length > 0) {
        setActiveAttachmentIdx(0);
      }
      setSignatureInput(user?.signature || `${user.name} (${user.position}) (인)`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodLocks = async () => {
    try {
      const response = await fetch('/api/period-locks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setPeriodLocks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const isLocked = (dateStr) => {
    if (!dateStr || periodLocks.length === 0) return false;
    const [year, month] = dateStr.split('-');
    const monthVal = `${year}-${month}`;
    const m = parseInt(month, 10);
    const halfVal = `${year}-${m <= 6 ? '1' : '2'}`;
    const yearVal = year;

    return periodLocks.some(lock => 
      (lock.period_type === 'MONTH' && lock.period_value === monthVal) ||
      (lock.period_type === 'HALF' && lock.period_value === halfVal) ||
      (lock.period_type === 'YEAR' && lock.period_value === yearVal)
    );
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 이 전표를 삭제하시겠습니까?')) return;
    try {
      const response = await fetch(`/api/vouchers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      const updatedSiblings = siblingIds.filter(x => x !== parseInt(id, 10));
      localStorage.setItem('filteredVoucherIds', JSON.stringify(updatedSiblings));
      
      alert('전표가 삭제되었습니다.');
      navigate('/vouchers');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async () => {
    const finalReason = cancelReasonType === '기타' ? cancelReasonDetail.trim() : cancelReasonType;
    if (!finalReason) {
      alert('회수 사유를 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/vouchers/${id}/cancel`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ reason: finalReason })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      alert('상신이 취소되었습니다. 전표가 임시저장 상태로 전환되었습니다.');
      setShowCancelModal(false);
      setCancelReasonDetail('');
      fetchVoucherDetail();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovalAction = async () => {
    if (actionType === 'REJECT' && !comment.trim()) {
      alert('반려 사유를 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/approvals/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType: 'VOUCHER',
          targetId: parseInt(id, 10),
          action: actionType,
          comment,
          signature: actionType === 'APPROVE' ? signatureInput : null
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setActionType(null);
      setComment('');
      fetchVoucherDetail();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 개별 첨부파일 정렬 순서 이동
  const handleMoveAttachment = async (index, direction) => {
    const newIdx = index + direction;
    if (!voucher || !voucher.attachments || newIdx < 0 || newIdx >= voucher.attachments.length) return;

    const updated = [...voucher.attachments];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;

    setVoucher(prev => ({ ...prev, attachments: updated }));
    setActiveAttachmentIdx(newIdx);

    const dbOrders = updated.map((att, idx) => ({ attachment_id: att.attachment_id, sort_order: idx }));
    try {
      await fetch('/api/vouchers/attachments/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orders: dbOrders })
      });
    } catch (err) {
      console.error('Failed to update sort order:', err);
    }
  };

  // 개별 첨부파일 삭제
  const handleDeleteAttachment = async (index) => {
    if (!voucher || !voucher.attachments) return;
    const target = voucher.attachments[index];
    if (!target) return;

    const confirmDelete = window.confirm('정말 이 영수증 사진을 삭제하시겠습니까?');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/vouchers/attachments/${target.attachment_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      alert('영수증 사진이 삭제되었습니다.');
      fetchVoucherDetail();
    } catch (err) {
      alert(`❌ 영수증 삭제 실패: ${err.message}`);
    }
  };

  const formatKrw = (amount) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'APPROVED': return '최종승인 완료';
      case 'REJECTED': return '반려됨';
      case 'TEMP': return '임시저장';
      case 'SUBMITTED': return '1차 승인 대기';
      case 'DEPT_APPROVED': return '최종 승인 대기';
      default: return status;
    }
  };

  const getApprovalGuideText = () => {
    if (!voucher) return null;

    const isDeptHead = user.userId === voucher.dept_head_approver_id;
    const isFinance = user.userId === voucher.finance_approver_id;
    const isSystemAdmin = user.role === 'SYSTEM_ADMIN';

    if (voucher.status === 'APPROVED') {
      return {
        type: 'success',
        text: '✅ 최종 승인이 완료된 전표입니다. (회계 장부에 정식 집계되었습니다)'
      };
    }

    if (voucher.status === 'REJECTED') {
      return {
        type: 'error',
        text: `❌ 반려된 전표입니다. (사유: ${voucher.reject_reason || '없음'})`
      };
    }

    if (voucher.status === 'TEMP') {
      return {
        type: 'info',
        text: '📝 임시저장 상태인 전표입니다. 기안자가 결재 요청(상신)을 올릴 수 있습니다.'
      };
    }

    if (voucher.status === 'SUBMITTED') {
      if (isDeptHead || isSystemAdmin) {
        return {
          type: 'action',
          text: '🔔 1차 결재 대기 중: 귀하의 승인을 대기 중입니다. 아래 [결재 승인] 단추를 눌러주십시오.'
        };
      }
      if (isFinance) {
        return {
          type: 'warning',
          text: `⏳ 1차 승인자(${voucher.dept_head_name || '부서장'})의 승인을 대기 중입니다. 1차 결재가 완료되면 회계팀장 승인이 활성화됩니다.`
        };
      }
      return {
        type: 'info',
        text: `⏳ 1차 승인자(${voucher.dept_head_name || '부서장'})의 결재 결정을 대기 중입니다.`
      };
    }

    if (voucher.status === 'DEPT_APPROVED') {
      if (isFinance || isSystemAdmin) {
        return {
          type: 'action',
          text: '🔔 최종 결재 대기 중: 1차 승인이 완료되었으며, 귀하의 최종 승인을 기다리고 있습니다. [결재 승인]을 진행해 주십시오.'
        };
      }
      if (isDeptHead) {
        return {
          type: 'warning',
          text: `⏳ 1차 승인을 완료했습니다. 최종 승인자(${voucher.finance_name || '회계팀장'})의 최종 결정을 대기 중입니다.`
        };
      }
      return {
        type: 'info',
        text: `⏳ 최종 승인자(${voucher.finance_name || '회계팀장'})의 최종 결재 승인을 대기 중입니다.`
      };
    }

    return null;
  };

  if (loading) return <div className="text-center text-xs text-slate-500 py-12">전표 상세 정보를 가져오는 중...</div>;
  if (!voucher) return <div className="text-center text-xs text-rose-400 py-12">{error || '전표를 찾을 수 없습니다.'}</div>;

  const isVoucherLocked = voucher ? isLocked(voucher.transaction_date) : false;

  const showDeptHeadButtons = voucher.status === 'SUBMITTED' && voucher.dept_head_approver_id === user.userId && !isVoucherLocked;
  const showFinanceButtons = voucher.status === 'DEPT_APPROVED' && voucher.finance_approver_id === user.userId && !isVoucherLocked;

  const isWriter = user.userId === voucher.writer_id;
  const showEditButtons = isWriter && (voucher.status === 'TEMP' || voucher.status === 'REJECTED') && !isVoucherLocked;
  const canModifyAttachments = showEditButtons;

  const guide = getApprovalGuideText();
  const hasAttachments = voucher.attachments && voucher.attachments.length > 0;
  const activeAtt = hasAttachments ? voucher.attachments[activeAttachmentIdx] : null;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-16">
      {/* 상단 네비게이션 및 좌우 이동 바 */}
      <div className="flex items-center justify-between text-slate-400 text-xs font-semibold bg-slate-900/40 p-2 rounded-xl border border-slate-800/30">
        <button onClick={() => navigate('/vouchers')} className="p-1 hover:text-white flex items-center gap-1 transition-colors">
          <ArrowLeft size={15} /> 목록으로
        </button>

        {siblingIds.length > 0 && currentIdx !== -1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={currentIdx === 0}
              onClick={() => navigateToSibling('prev')}
              className="p-1 flex items-center gap-0.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
              title="이전 전표 (방향키 ←)"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[10px] text-slate-500 font-mono select-none">{currentIdx + 1} / {siblingIds.length}</span>
            <button
              disabled={currentIdx === siblingIds.length - 1}
              onClick={() => navigateToSibling('next')}
              className="p-1 flex items-center gap-0.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
              title="다음 전표 (방향키 →)"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          {isVoucherLocked && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              🔒 결산 마감됨
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
            voucher.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            voucher.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
            voucher.status === 'TEMP' ? 'bg-slate-800 text-slate-400 border border-slate-700/50' :
            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {getStatusText(voucher.status)}
          </span>
        </div>
      </div>

      {/* 영수증 갤러리 메인 뷰 */}
      {hasAttachments ? (
        <div className="glass rounded-2xl overflow-hidden aspect-[4/3] bg-slate-950 flex flex-col justify-between border border-slate-800 relative group">
          {/* 영수증 메인 이미지 */}
          <div className="w-full h-full relative flex items-center justify-center">
            <img src={activeAtt.url} alt="영수증 원본" className="h-full object-contain cursor-pointer" onDoubleClick={() => setZoomUrl(activeAtt.url)} />

            {/* 개별 영수증 OCR 상태 표시 */}
            <div className="absolute top-3 left-3 flex gap-1 items-center">
              {activeAtt.ocr_status === 'PENDING' && (
                <span className="bg-slate-800/90 border border-slate-700 text-slate-300 font-bold text-[9px] px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Clock size={10} /> 분석 대기
                </span>
              )}
              {activeAtt.ocr_status === 'PROCESSING' && (
                <span className="bg-blue-500/90 border border-blue-400 text-white font-bold text-[9px] px-2 py-1 rounded-full flex items-center gap-1 shadow-md animate-pulse">
                  <Loader2 size={10} className="animate-spin" /> AI 분석 중
                </span>
              )}
              {activeAtt.ocr_status === 'COMPLETED' && (
                <span className="bg-emerald-500/90 border border-emerald-400 text-slate-950 font-bold text-[9px] px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <CheckCircle2 size={10} /> AI 분석 완료
                </span>
              )}
              {activeAtt.ocr_status === 'FAILED' && (
                <span className="bg-rose-500/90 border border-rose-400 text-white font-bold text-[9px] px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <AlertTriangle size={10} /> AI 분석 실패
                </span>
              )}
            </div>

            {/* 영수증 제어 단추 */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                onClick={() => setZoomUrl(activeAtt.url)}
                className="bg-slate-900/80 border border-slate-700/50 hover:bg-slate-800 text-white rounded-full p-2.5 transition-colors"
                title="확대 보기"
              >
                <Maximize2 size={15} />
              </button>
              <a
                href={activeAtt.url}
                download={activeAtt.file_name}
                className="bg-slate-900/80 border border-slate-700/50 hover:bg-slate-800 text-white rounded-full p-2.5 transition-colors"
                title="다운로드"
              >
                <Download size={15} />
              </a>

              {canModifyAttachments && (
                <>
                  <button
                    onClick={() => handleMoveAttachment(activeAttachmentIdx, -1)}
                    disabled={activeAttachmentIdx === 0}
                    className="bg-slate-900/80 border border-slate-700/50 hover:bg-slate-800 text-white rounded-full p-2 disabled:opacity-40"
                    title="왼쪽 이동"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => handleMoveAttachment(activeAttachmentIdx, 1)}
                    disabled={activeAttachmentIdx === voucher.attachments.length - 1}
                    className="bg-slate-900/80 border border-slate-700/50 hover:bg-slate-800 text-white rounded-full p-2 disabled:opacity-40"
                    title="오른쪽 이동"
                  >
                    <ChevronRight size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteAttachment(activeAttachmentIdx)}
                    className="bg-rose-950/85 border border-rose-800/40 hover:bg-rose-900 text-white rounded-full p-2"
                    title="삭제"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl py-8 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 text-center">
          <AlertTriangle size={24} className="text-slate-600 mb-1" />
          <span className="text-[10px]">첨부파일(영수증)이 누락된 전표입니다.</span>
        </div>
      )}

      {/* 영수증 갤러리 썸네일 */}
      {hasAttachments && voucher.attachments.length > 1 && (
        <div className="flex gap-2 items-center overflow-x-auto p-1.5 bg-slate-950/40 rounded-xl border border-slate-900">
          {voucher.attachments.map((att, idx) => (
            <div 
              key={att.attachment_id}
              onClick={() => setActiveAttachmentIdx(idx)}
              className={`relative w-12 h-12 rounded-lg overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 ${idx === activeAttachmentIdx ? 'border-church-500 scale-105 shadow' : 'border-slate-800 opacity-60'}`}
            >
              <img src={att.url} className="w-full h-full object-cover" />
              {att.ocr_status === 'PROCESSING' && (
                <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                  <Loader2 size={10} className="text-church-400 animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 현재 선택된 영수증의 AI 태그 */}
      {activeAtt?.tags && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900/40 rounded-xl border border-slate-900/60">
          <span className="text-[9px] font-bold text-church-400 uppercase tracking-wider mr-1 mt-1">AI Tags:</span>
          {activeAtt.tags.split(',').map((tag, tIdx) => (
            <span key={tIdx} className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700/50 shadow-sm">
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* 전표 기본 세부 내역 */}
      <div className="glass p-4 rounded-2xl space-y-3.5 shadow-md border border-slate-800">
        <div className="flex justify-between items-start border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-xs font-bold text-white leading-tight">{voucher.summary}</h3>
            <p className="text-[9px] text-slate-400 mt-1">[{voucher.organization_name}] {voucher.group_name} · {voucher.writer_name} 작성</p>
          </div>
          <span className="text-sm font-bold text-white tracking-tight">{formatKrw(voucher.amount)}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-church-400 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 block">거래일자</span>
              <span className="text-white font-medium">{voucher.transaction_date}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Shield size={14} className="text-church-400 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 block">계정과목</span>
              <span className="text-white font-medium">[{voucher.parent_category}] {voucher.child_category}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-church-400 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 block">결제수단 / 가맹점</span>
              <span className="text-white font-medium">{voucher.payment_method === 'CARD' ? '카드' : voucher.payment_method === 'BANK_TRANSFER' ? '이체' : '현금'} / {voucher.vendor || '-'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-church-400 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 block">메모</span>
              <span className="text-white font-medium max-w-[130px] truncate block">{voucher.memo || '-'}</span>
            </div>
          </div>
        </div>

        {/* 지정 결재선 노출 */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs">
          <div className="font-semibold text-slate-400 flex items-center gap-1">
            <Users size={12} className="text-church-400" /> 지정 전결 라인
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-[8px] text-slate-500 block">1차 승인자 (부서장)</span>
              <span className="text-white font-semibold">{voucher.dept_head_name || '미지정'}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-[8px] text-slate-500 block">최종 승인자 (회계팀장)</span>
              <span className="text-white font-semibold">{voucher.finance_name || '미지정'}</span>
            </div>
          </div>
        </div>

        {voucher.status === 'REJECTED' && voucher.reject_reason && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs space-y-1">
            <div className="font-bold">❌ 결재 반려 사유</div>
            <div className="text-[11px] text-rose-300/90">{voucher.reject_reason}</div>
          </div>
        )}
      </div>

      {/* 결재 진행 가이드 문구 */}
      {guide && (
        <div className={`p-3.5 rounded-2xl text-[11px] font-semibold border leading-relaxed shadow-sm ${
          guide.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
          guide.type === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
          guide.type === 'action' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse-subtle' :
          guide.type === 'warning' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
          'bg-slate-900/60 text-slate-400 border-slate-800'
        }`}>
          {guide.text}
        </div>
      )}

      {/* 결재 타임라인 (디지털 도장 렌더링) */}
      <div className="glass p-4 rounded-2xl shadow-md border border-slate-800">
        <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
          <Clock size={13} className="text-church-400" /> 결재 타임라인 & 디지털 인장
        </h4>

        <div className="space-y-4 relative pl-5 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
          {voucher.histories?.length === 0 ? (
            <div className="text-[10px] text-slate-500 pl-1 py-1">임시저장 상태입니다.</div>
          ) : (
            voucher.histories?.map((h) => {
              const isActionApprove = h.action === 'APPROVE' || h.action === 'SUBMIT' || h.action === 'RESUBMIT';
              return (
                <div key={h.history_id} className="relative text-xs">
                  <div className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                    isActionApprove ? 'bg-emerald-500 border-slate-950' : 'bg-rose-500 border-slate-950'
                  }`} />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-white">{h.actor_name}</span>
                      <span className="text-[9px] text-slate-400 ml-1">({h.actor_position})</span>
                    </div>
                    <span className="text-[9px] text-slate-500">{new Date(h.created_at).toLocaleString('ko-KR', { hour12: false, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div className="text-[11px] text-slate-300 mt-1 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/40 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-church-400 block mb-0.5">
                        {h.action === 'SUBMIT' && '결재 상신'}
                        {h.action === 'RESUBMIT' && '재상신'}
                        {h.action === 'APPROVE' && `${h.step_number === 1 ? '1차 승인' : '최종 승인'}`}
                        {h.action === 'REJECT' && '결재 반려'}
                        {h.action === 'CANCEL' && '상신 취소'}
                      </span>
                      {h.comment && <span className="text-slate-400 block text-[10px]">{h.comment}</span>}
                    </div>

                    {isActionApprove && h.signature && (
                      h.signature.startsWith('data:image') ? (
                        <div className="p-1 border border-slate-800/80 bg-white/5 rounded-lg select-none shrink-0 shadow-sm overflow-hidden flex items-center justify-center h-10 w-24">
                          <img 
                            src={h.signature} 
                            alt="친필서명" 
                            className="h-full w-auto object-contain max-h-[36px]" 
                          />
                        </div>
                      ) : (
                        <div className="border-2 border-emerald-500/80 text-emerald-400 font-bold rounded-lg text-[9px] py-1 px-2 rotate-[-5deg] bg-emerald-500/5 select-none font-mono shrink-0 shadow-sm">
                          {h.signature}
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 결재 버튼 바 */}
      {(showDeptHeadButtons || showFinanceButtons) && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setActionType('REJECT')}
            className="bg-rose-500/20 border border-rose-500/40 text-rose-400 py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-colors"
          >
            <X size={14} /> 반려 처리
          </button>
          <button
            onClick={() => setActionType('APPROVE')}
            className="bg-emerald-500 text-slate-950 py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <Check size={14} /> 결재 승인
          </button>
        </div>
      )}

      {/* 작성자 편집 버튼 */}
      {showEditButtons && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDelete}
            className="bg-rose-500/10 border border-rose-500/30 text-rose-400 py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 size={14} /> 삭제하기
          </button>
          <button
            onClick={() => navigate(`/vouchers/edit/${id}`)}
            className="bg-church-600 text-white py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <Edit size={14} /> 내용 수정
          </button>
        </div>
      )}

      {/* 작성자 상신 취소 (결재 회수) 버튼 */}
      {isWriter && (voucher.status === 'SUBMITTED' || voucher.status === 'DEPT_APPROVED') && !isVoucherLocked && (
        <div className="flex justify-center">
          <button
            onClick={handleCancel}
            className="w-full bg-amber-500/20 border border-amber-500/40 text-amber-400 py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 hover:bg-amber-500/30 transition-colors"
          >
            <X size={14} /> 상신 취소 (결재 회수)
          </button>
        </div>
      )}

      {/* 결재 서명 모달 */}
      {actionType && (
        <div className="fixed inset-0 z-55 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass w-full max-w-sm rounded-2xl p-5 space-y-4 border border-slate-700/50">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white">
                {actionType === 'APPROVE' ? '결재 승인 서명' : '결재 반려 사유'}
              </h3>
              <button onClick={() => setActionType(null)} className="text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {actionType === 'APPROVE' ? (
              <div className="space-y-3">
                {signatureInput && signatureInput.startsWith('data:image') ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block">등록된 디지털 친필 서명 *</label>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex justify-center items-center h-20 relative">
                      <img src={signatureInput} alt="서명 이미지" className="h-full w-auto object-contain max-h-[60px]" />
                      <button
                        type="button"
                        onClick={() => setSignatureInput(`${user?.name || ''} (${user?.position || ''}) (인)`)}
                        className="absolute right-2 bottom-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700/50 px-2 py-0.5 rounded text-[8px] font-bold"
                      >
                        글자로 변경
                      </button>
                    </div>
                    <p className="text-[8px] text-amber-500 font-semibold leading-normal">
                      ※ 가입 시 등록한 자필 사인이 자동으로 스탬프로 날인됩니다.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">디지털 인장 서명 문구 *</label>
                    <input
                      type="text"
                      value={signatureInput}
                      onChange={(e) => setSignatureInput(e.target.value)}
                      placeholder="예: 홍길동 (인)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-church-500 font-semibold"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">승인 의견 (선택)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="승인 시 메모할 사항이 있으면 입력하세요."
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400">반려 사유 (필수) *</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="반려 사유를 작성하세요."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-church-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setActionType(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-bold"
              >
                취소
              </button>
              <button
                onClick={handleApprovalAction}
                disabled={submitting}
                className={`py-2.5 rounded-xl text-xs font-bold text-slate-950 disabled:opacity-50 ${
                  actionType === 'APPROVE' ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-rose-400 hover:bg-rose-300'
                }`}
              >
                {submitting ? '처리 중...' : actionType === 'APPROVE' ? '승인하기' : '반려하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상신 취소 사유 모달 */}
      {showCancelModal && (
        <div className="fixed inset-0 z-55 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass w-full max-w-sm rounded-2xl p-5 space-y-4 border border-slate-700/50">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white">결재 상신 회수 (상신 취소) 사유</h3>
              <button onClick={() => { setShowCancelModal(false); setCancelReasonDetail(''); }} className="text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">회수 사유 선택 *</label>
                <select
                  value={cancelReasonType}
                  onChange={(e) => setCancelReasonType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-church-500"
                >
                  <option value="금액 수정">금액 수정</option>
                  <option value="영수증 누락">영수증 누락</option>
                  <option value="계정과목 수정">계정과목 수정</option>
                  <option value="오입력">오입력</option>
                  <option value="기타">기타 (직접 입력)</option>
                </select>
              </div>

              {cancelReasonType === '기타' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">직접 입력 *</label>
                  <textarea
                    value={cancelReasonDetail}
                    onChange={(e) => setCancelReasonDetail(e.target.value)}
                    placeholder="상세 회수 사유를 입력하십시오."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-church-500"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReasonDetail(''); }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-bold"
              >
                취소
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={submitting}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {submitting ? '처리 중...' : '회수하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {zoomUrl && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomUrl(null)}
        >
          <img src={zoomUrl} className="max-w-full max-h-[85vh] object-contain" alt="확대 영수증" />
          <div className="mt-4 flex gap-4">
            <a
              href={zoomUrl}
              download
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow"
            >
              <Download size={14} /> 영수증 이미지 저장
            </a>
            <button
              onClick={() => setZoomUrl(null)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2.5 px-4 rounded-xl shadow"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
