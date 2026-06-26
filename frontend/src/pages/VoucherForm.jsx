import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  Camera, Save, Send, ArrowLeft, Loader2, Sparkles, UserCheck, 
  Trash2, ChevronLeft, ChevronRight, RefreshCw, Eye, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react';

export default function VoucherForm() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);

  // 폼 상태
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionType, setTransactionType] = useState('EXPENSE');
  const [categoryId, setCategoryId] = useState('');
  const [summary, setSummary] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [memo, setMemo] = useState('');

  // 다중 첨부파일 상태
  const [attachments, setAttachments] = useState([]);
  const [activeAttachmentIdx, setActiveAttachmentIdx] = useState(0);

  // 결재자 설정 상태
  const [deptHeadApproverId, setDeptHeadApproverId] = useState('');
  const [financeApproverId, setFinanceApproverId] = useState('');
  const [deptHeadsList, setDeptHeadsList] = useState([]);
  const [financeList, setFinanceList] = useState([]);

  // UI 상태
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. 카테고리 및 결재선 목록 조회
  useEffect(() => {
    fetchCategories();
    fetchApprovers();
    if (id) {
      fetchVoucherDetail();
    }
  }, [id, token]);

  // 2. SSE 실시간 OCR 완료 업데이트 수신
  useEffect(() => {
    if (!token) return;
    const eventSource = new EventSource(`/api/vouchers/sse?token=${token}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE OCR Update in Form:', data);

        setAttachments(prev => prev.map(att => {
          if (att.attachment_id && att.attachment_id === data.attachment_id) {
            return {
              ...att,
              ocr_status: data.ocr_status,
              ocr_result: data.ocr_result || att.ocr_result,
              tags: data.tags ? data.tags.join(',') : att.tags
            };
          }
          return att;
        }));
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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setCategories(data);
        if (data.length > 0 && !categoryId) {
          setCategoryId(data.find(c => c.type === transactionType)?.category_id || data[0].category_id);
        }
      } else {
        console.error('Failed to fetch categories:', data.message || 'Unknown error');
        setError(data.message || '카테고리 정보를 불러오지 못했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('서버 연결에 실패했습니다.');
    }
  };

  const fetchApprovers = async () => {
    try {
      const response = await fetch('/api/users/approvers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setDeptHeadsList(data.deptHeads || []);
        setFinanceList(data.financeTeams || []);

        const savedDeptHead = localStorage.getItem('preferred_dept_head_approver');
        const savedFinance = localStorage.getItem('preferred_finance_approver');

        if (savedDeptHead && data.deptHeads?.some(h => h.user_id.toString() === savedDeptHead)) {
          setDeptHeadApproverId(savedDeptHead);
        } else if (data.deptHeads?.length > 0) {
          setDeptHeadApproverId(data.deptHeads[0].user_id.toString());
        }

        if (savedFinance && data.financeTeams?.some(f => f.user_id.toString() === savedFinance)) {
          setFinanceApproverId(savedFinance);
        } else if (data.financeTeams?.length > 0) {
          setFinanceApproverId(data.financeTeams[0].user_id.toString());
        }
      } else {
        console.error('Failed to fetch approvers:', data.message || 'Unknown error');
        setError(data.message || '결재자 정보를 불러오지 못했습니다.');
      }
    } catch (err) {
      console.error('Fetch approvers error:', err);
      setError('서버 연결에 실패했습니다.');
    }
  };

  const fetchVoucherDetail = async () => {
    try {
      const response = await fetch(`/api/vouchers/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setTransactionDate(data.transaction_date);
      setTransactionType(data.transaction_type);
      setCategoryId(data.category_id);
      setSummary(data.summary);
      setVendor(data.vendor || '');
      setAmount(data.amount.toString());
      setPaymentMethod(data.payment_method || 'CARD');
      setMemo(data.memo || '');
      if (data.dept_head_approver_id) {
        setDeptHeadApproverId(data.dept_head_approver_id.toString());
      }
      if (data.finance_approver_id) {
        setFinanceApproverId(data.finance_approver_id.toString());
      }

      if (data.attachments) {
        setAttachments(data.attachments);
        if (data.attachments.length > 0) {
          setActiveAttachmentIdx(0);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTypeChange = (type) => {
    setTransactionType(type);
    const filtered = categories.filter(c => c.type === type);
    if (filtered.length > 0) {
      setCategoryId(filtered[0].category_id);
    }
  };

  // 다중 파일 선택 처리
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newAttachments = files.map(file => ({
      id: 'temp-' + Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file),
      ocr_status: 'PENDING',
      ocr_result: null,
      tags: ''
    }));

    setAttachments(prev => {
      const updated = [...prev, ...newAttachments];
      setActiveAttachmentIdx(updated.length - newAttachments.length);
      return updated;
    });
    setError('');
  };

  // 개별 영수증 파일 삭제
  const handleDeleteAttachment = async (index) => {
    const target = attachments[index];
    if (!target) return;

    if (target.attachment_id) {
      const confirmDelete = window.confirm('서버에 등록된 영수증입니다. 정말로 이 영수증 사진을 삭제하시겠습니까?');
      if (!confirmDelete) return;

      try {
        const response = await fetch(`/api/vouchers/attachments/${target.attachment_id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.message);
      } catch (err) {
        alert(`❌ 영수증 삭제 실패: ${err.message}`);
        return;
      }
    }

    setAttachments(prev => {
      const updated = prev.filter((_, idx) => idx !== index);
      setActiveAttachmentIdx(prevIdx => {
        if (prevIdx >= updated.length) return Math.max(0, updated.length - 1);
        return prevIdx;
      });
      return updated;
    });
  };

  // 영수증 순서 정렬 변경
  const handleMoveAttachment = async (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= attachments.length) return;

    const updated = [...attachments];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;

    setAttachments(updated);
    setActiveAttachmentIdx(newIdx);

    const dbOrders = updated
      .map((att, idx) => ({ attachment_id: att.attachment_id, sort_order: idx }))
      .filter(x => x.attachment_id !== undefined);

    if (dbOrders.length > 0) {
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
        console.error('Failed to save order in DB:', err);
      }
    }
  };

  const handleSubmit = async (submitType) => {
    if (!categoryId || !summary || !amount || !deptHeadApproverId || !financeApproverId) {
      const msg = '필수 항목(적요, 계정과목, 금액 및 결재선)을 모두 지정해 주세요.';
      setError(msg);
      alert(`⚠️ 입력 오류\n\n${msg}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (transactionType === 'EXPENSE' && attachments.length === 0) {
      const msg = '지출 전표는 영수증(첨부파일) 등록이 필수입니다. 화면 상단에서 사진을 추가해 주세요.';
      setError(msg);
      alert(`⚠️ 영수증 누락\n\n${msg}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setError('');

    localStorage.setItem('preferred_dept_head_approver', deptHeadApproverId);
    localStorage.setItem('preferred_finance_approver', financeApproverId);

    const formData = new FormData();
    formData.append('transaction_date', transactionDate);
    formData.append('transaction_type', transactionType);
    formData.append('category_id', categoryId);
    formData.append('summary', summary);
    formData.append('vendor', vendor);
    formData.append('amount', amount);
    formData.append('payment_method', paymentMethod);
    formData.append('status', submitType);
    formData.append('memo', memo);
    formData.append('dept_head_approver_id', deptHeadApproverId);
    formData.append('finance_approver_id', financeApproverId);

    // 신규 추가된 파일들 추가
    attachments.forEach(att => {
      if (att.file) {
        formData.append('receipts', att.file);
      }
    });

    try {
      const url = id ? `/api/vouchers/${id}` : '/api/vouchers';
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '전표 저장 실패');

      alert(submitType === 'SUBMITTED' ? '결재 상신(결재요청)이 완료되었습니다.' : '전표가 임시저장되었습니다.');
      navigate('/vouchers');
    } catch (err) {
      setError(err.message);
      alert(`❌ 저장 실패\n\n${err.message}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current.click();
  };

  // 현재 활성화된 첨부파일 정보
  const activeAtt = attachments[activeAttachmentIdx];
  const activeOcr = activeAtt?.ocr_result;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-16">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
        <button onClick={() => navigate(-1)} className="p-1 hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </button>
        <span>{id ? '전표 수정' : '신규 전표 등록'}</span>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* 1. 영수증 업로드 & 프리뷰 */}
      <div className="glass rounded-2xl overflow-hidden relative border border-slate-800">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />

        {activeAtt ? (
          <div className="relative aspect-[4/3] w-full bg-slate-950 flex items-center justify-center">
            <img src={activeAtt.url} alt="영수증 원본" className="h-full object-contain" />
            
            {/* 개별 영수증 분석 상태 배지 */}
            <div className="absolute top-3 left-3 flex gap-1 items-center">
              {activeAtt.ocr_status === 'PENDING' && (
                <span className="bg-slate-800/90 border border-slate-700 text-slate-300 font-bold text-[9px] px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Clock size={10} /> 백그라운드 대기
                </span>
              )}
              {activeAtt.ocr_status === 'PROCESSING' && (
                <span className="bg-blue-500/90 border border-blue-400 text-white font-bold text-[9px] px-2 py-1 rounded-full flex items-center gap-1 shadow-md animate-pulse">
                  <Loader2 size={10} className="animate-spin" /> AI 분석 중
                </span>
              )}
              {activeAtt.ocr_status === 'COMPLETED' && (
                <span className="bg-emerald-500/90 border border-emerald-400 text-slate-950 font-bold text-[9px] px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <CheckCircle2 size={10} /> AI 추천 준비됨
                </span>
              )}
              {activeAtt.ocr_status === 'FAILED' && (
                <span className="bg-rose-500/90 border border-rose-400 text-white font-bold text-[9px] px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <AlertTriangle size={10} /> AI 분석 실패
                </span>
              )}
            </div>

            {/* 개별 영수증 제어 오버레이 */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                onClick={() => handleMoveAttachment(activeAttachmentIdx, -1)}
                disabled={activeAttachmentIdx === 0}
                className="bg-slate-900/80 border border-slate-700/50 hover:bg-slate-800 text-white rounded-full p-2 disabled:opacity-40 transition-colors"
                title="왼쪽으로 이동"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => handleMoveAttachment(activeAttachmentIdx, 1)}
                disabled={activeAttachmentIdx === attachments.length - 1}
                className="bg-slate-900/80 border border-slate-700/50 hover:bg-slate-800 text-white rounded-full p-2 disabled:opacity-40 transition-colors"
                title="오른쪽으로 이동"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => handleDeleteAttachment(activeAttachmentIdx)}
                className="bg-rose-950/80 border border-rose-800/50 hover:bg-rose-900 text-white rounded-full p-2 transition-all shadow-md"
                title="영수증 사진 삭제"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={handleCameraClick}
                className="bg-church-600 border border-church-500 hover:bg-church-500 text-white rounded-full p-2 shadow-lg active:scale-95 transition-all"
                title="사진 추가 등록"
              >
                <Camera size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={handleCameraClick}
            className="aspect-[4/3] w-full bg-slate-900/60 border border-dashed border-slate-800 hover:border-church-500/50 flex flex-col items-center justify-center text-center p-6 cursor-pointer transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <Camera size={22} />
            </div>
            <span className="text-xs font-bold text-slate-300">영수증 촬영 또는 사진 올리기</span>
            <span className="text-[10px] text-slate-500 mt-1">여러 장의 영수증 사진을 한 번에 올릴 수 있습니다.</span>
          </div>
        )}
      </div>

      {/* 영수증 갤러리 썸네일 슬라이더 */}
      {attachments.length > 0 && (
        <div className="flex gap-2 items-center overflow-x-auto p-1.5 bg-slate-950/40 rounded-xl border border-slate-900">
          {attachments.map((att, idx) => (
            <div 
              key={att.id || att.attachment_id}
              onClick={() => setActiveAttachmentIdx(idx)}
              className={`relative w-14 h-14 rounded-lg overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 ${idx === activeAttachmentIdx ? 'border-church-500 scale-105 shadow-md' : 'border-slate-800 opacity-60'}`}
            >
              <img src={att.url} className="w-full h-full object-cover" />
              {att.ocr_status === 'PROCESSING' && (
                <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                  <Loader2 size={12} className="text-church-400 animate-spin" />
                </div>
              )}
              {att.ocr_status === 'COMPLETED' && (
                <div className="absolute bottom-0.5 right-0.5 bg-emerald-500 rounded-full p-0.5">
                  <CheckCircle2 size={8} className="text-slate-950" />
                </div>
              )}
              {att.ocr_status === 'FAILED' && (
                <div className="absolute bottom-0.5 right-0.5 bg-rose-500 rounded-full p-0.5">
                  <AlertTriangle size={8} className="text-white" />
                </div>
              )}
            </div>
          ))}
          <button 
            onClick={handleCameraClick}
            className="w-14 h-14 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
          >
            <Camera size={16} />
            <span className="text-[8px] mt-0.5">추가</span>
          </button>
        </div>
      )}

      {/* AI 추천된 태그 표시 영역 */}
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

      {/* 2. 입력 폼 */}
      <div className="glass p-4 rounded-2xl space-y-4 border border-slate-800">
        <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => handleTypeChange('EXPENSE')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${transactionType === 'EXPENSE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400'}`}
          >
            지출 (EXPENSE)
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('INCOME')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${transactionType === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'}`}
          >
            수입 (INCOME)
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 거래일자 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400">거래일자 *</label>
              {activeOcr?.transaction_date && activeOcr.transaction_date !== transactionDate && (
                <button
                  type="button"
                  onClick={() => setTransactionDate(activeOcr.transaction_date)}
                  className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded hover:bg-emerald-500/20 flex items-center gap-0.5 shadow-sm"
                >
                  <Sparkles size={8} /> 추천
                </button>
              )}
            </div>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-church-500"
            />
          </div>

          {/* 금액 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400">금액 * (숫자만)</label>
              {activeOcr?.amount > 0 && activeOcr.amount.toString() !== amount && (
                <button
                  type="button"
                  onClick={() => setAmount(activeOcr.amount.toString())}
                  className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded hover:bg-emerald-500/20 flex items-center gap-0.5 shadow-sm"
                >
                  <Sparkles size={8} /> 추천
                </button>
              )}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-church-500 font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 계정과목 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400">계정과목 *</label>
              {activeOcr?.recommendations?.categoryId && activeOcr.recommendations.categoryId.toString() !== categoryId && (
                <button
                  type="button"
                  onClick={() => setCategoryId(activeOcr.recommendations.categoryId.toString())}
                  className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded hover:bg-emerald-500/20 flex items-center gap-0.5 shadow-sm"
                >
                  <Sparkles size={8} /> 추천
                </button>
              )}
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-church-500"
            >
              {Array.isArray(categories) && categories
                .filter(c => c.type === transactionType)
                .map(c => (
                  <option key={c.category_id} value={c.category_id}>
                    [{c.parent_category}] {c.child_category}
                  </option>
                ))}
            </select>
          </div>

          {/* 사용처 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400">사용처/가맹점</label>
              {activeOcr?.vendor && activeOcr.vendor !== '식별 불가(수동 입력)' && activeOcr.vendor !== vendor && (
                <button
                  type="button"
                  onClick={() => setVendor(activeOcr.vendor)}
                  className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded hover:bg-emerald-500/20 flex items-center gap-0.5 shadow-sm"
                >
                  <Sparkles size={8} /> 추천
                </button>
              )}
            </div>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="예: 다이소"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-church-500"
            />
          </div>
        </div>

        {/* 적요 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400">적요 *</label>
            {activeOcr?.recommendations?.summary && activeOcr.recommendations.summary !== summary && (
              <button
                type="button"
                onClick={() => setSummary(activeOcr.recommendations.summary)}
                className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded hover:bg-emerald-500/20 flex items-center gap-0.5 shadow-sm"
              >
                <Sparkles size={8} /> 추천
              </button>
            )}
          </div>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="상세 내역 기재 (예: 주보 간지 구입)"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-church-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400">결제수단</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-church-500"
            >
              <option value="CARD">카드 결제</option>
              <option value="BANK_TRANSFER">계좌 이체</option>
              <option value="CASH">현금 영수증</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400">추가 메모</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="비고"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {/* AI 부가 정보 노출 (사업자 번호, 승인 번호) */}
        {activeOcr && (activeOcr.business_number || activeOcr.approval_number) && (
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px]">
            {activeOcr.business_number && (
              <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-900 flex flex-col">
                <span className="text-slate-500 font-bold">사업자번호</span>
                <span className="text-slate-300 font-mono mt-0.5">{activeOcr.business_number}</span>
              </div>
            )}
            {activeOcr.approval_number && (
              <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-900 flex flex-col">
                <span className="text-slate-500 font-bold">카드승인번호</span>
                <span className="text-slate-300 font-mono mt-0.5">{activeOcr.approval_number}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. 결재 전결라인 설정 카드 */}
      <div className="glass p-4 rounded-2xl space-y-3.5 shadow-md border border-slate-800">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <UserCheck size={14} className="text-church-400" /> 전결 라인 결재자 지정 (자동 기억)
        </h4>
        <p className="text-[9px] text-slate-500">한 번 설정하면 다음 전표 등록 시 해당 결재선이 기본값으로 자동지정됩니다.</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400">1차 결재자 (부서장) *</label>
            <select
              value={deptHeadApproverId}
              onChange={(e) => setDeptHeadApproverId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-church-500"
            >
              <option value="" disabled>1차 결재자 선택</option>
              {deptHeadsList.map(h => (
                <option key={h.user_id} value={h.user_id}>{h.name} ({h.position})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400">최종 결재자 (회계팀/위원장) *</label>
            <select
              value={financeApproverId}
              onChange={(e) => setFinanceApproverId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-church-500"
            >
              <option value="" disabled>최종 결재자 선택</option>
              {financeList.map(f => (
                <option key={f.user_id} value={f.user_id}>{f.name} ({f.position})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. 하단 버튼그룹 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmit('TEMP')}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-colors"
        >
          임시저장
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmit('SUBMITTED')}
          className="bg-gradient-to-r from-church-600 to-church-500 hover:brightness-110 text-white py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all"
        >
          결재요청 (상신)
        </button>
      </div>
    </div>
  );
}
