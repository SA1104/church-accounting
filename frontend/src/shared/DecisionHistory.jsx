import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  Clock, 
  Cpu, 
  Search, 
  Filter, 
  TrendingUp, 
  Building2, 
  Home, 
  Globe, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  ThumbsUp,
  Star
} from 'lucide-react';

export default function DecisionHistory() {
  const { token } = useAuth();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterWorkspace, setFilterWorkspace] = useState('all');
  const [filterCapability, setFilterCapability] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  
  // Feedback modal states
  const [selectedDec, setSelectedDec] = useState(null);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchDecisions();
  }, [token]);

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/decisions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDecisions(data);
      }
    } catch (err) {
      console.error('Error fetching decisions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, nextStatus) => {
    try {
      const res = await fetch(`/api/decisions/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchDecisions();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDec) return;

    setSubmittingFeedback(true);
    try {
      const res = await fetch(`/api/decisions/${selectedDec.id}/feedback`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          comments: feedbackComments,
          satisfaction: feedbackRating,
          learningScore: 75 + Math.floor(Math.random() * 20) // Random smart learning score 75-95
        })
      });
      if (res.ok) {
        setSelectedDec(null);
        setFeedbackComments('');
        fetchDecisions();
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getCapabilityIcon = (cap) => {
    switch (cap) {
      case 'church': return <Building2 size={14} className="text-indigo-400" />;
      case 'stock': return <TrendingUp size={14} className="text-emerald-400" />;
      case 'estate': return <Home size={14} className="text-violet-400" />;
      case 'mission': return <Globe size={14} className="text-cyan-400" />;
      default: return <Cpu size={14} className="text-slate-400" />;
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'HIGH': return 'text-rose-400 bg-rose-500/10 border-rose-500/25';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
      case 'LOW':
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'Executed': return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
      case 'Learned': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Generated':
      default: return 'text-slate-400 bg-slate-800/60 border-slate-700/40';
    }
  };

  const filteredDecisions = decisions.filter(d => {
    if (filterWorkspace !== 'all' && d.workspaceId !== filterWorkspace) return false;
    if (filterCapability !== 'all' && d.capabilityId !== filterCapability) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    if (filterRisk !== 'all' && d.riskLevel !== filterRisk) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.decisionType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 space-y-4 font-sans select-none">
      {/* Title */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-400" />
            Decision History
          </h1>
          <p className="text-[9px] text-slate-500 mt-0.5">BOOZA THINK OS 통합 의사결정 라이프사이클 이력</p>
        </div>
        <button 
          onClick={fetchDecisions}
          className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg active:scale-95 transition-all"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter Block */}
      <div className="glass p-3 rounded-2xl border border-slate-900 bg-slate-950/20 space-y-2.5">
        {/* Search */}
        <div className="relative flex items-center">
          <Search size={13} className="text-slate-500 absolute left-3" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="의사결정 제목, 설명, 유형 검색..."
            className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl py-2 pl-9 pr-4 text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] font-bold">
          <div>
            <label className="text-slate-500 block mb-1">Workspace</label>
            <select
              value={filterWorkspace}
              onChange={(e) => setFilterWorkspace(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg p-1.5 focus:outline-none"
            >
              <option value="all">전체</option>
              <option value="ws-shingil">신길교회</option>
              <option value="ws-invest">내 투자계정</option>
              <option value="ws-seoul">서울권 분석</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 block mb-1">Capability</label>
            <select
              value={filterCapability}
              onChange={(e) => setFilterCapability(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg p-1.5 focus:outline-none"
            >
              <option value="all">전체</option>
              <option value="church">Church Think</option>
              <option value="stock">Stock Think</option>
              <option value="estate">Estate Think</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 block mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg p-1.5 focus:outline-none"
            >
              <option value="all">전체</option>
              <option value="Generated">Generated</option>
              <option value="Approved">Approved</option>
              <option value="Executed">Executed</option>
              <option value="Learned">Learned</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 block mb-1">Risk Level</label>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg p-1.5 focus:outline-none"
            >
              <option value="all">전체</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
        </div>
      </div>

      {/* Decision Timeline List */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-500 text-[10px] gap-2">
          <RefreshCw className="animate-spin text-indigo-400" size={16} />
          <span>의사결정 이력을 불러오는 중...</span>
        </div>
      ) : filteredDecisions.length === 0 ? (
        <p className="text-[10px] text-slate-500 text-center py-12">조건에 부합하는 의사결정이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {filteredDecisions.map((dec) => (
            <div 
              key={dec.id} 
              className="glass p-4.5 rounded-2xl border border-slate-900 bg-slate-900/30 space-y-3"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[7.5px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                      {dec.id}
                    </span>
                    <div className="flex items-center gap-1 text-[8.5px] text-slate-400 font-bold">
                      {getCapabilityIcon(dec.capabilityId)}
                      <span>{dec.workspaceName}</span>
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-white leading-snug">{dec.title}</h3>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold border ${getStatusColor(dec.status)}`}>
                    {dec.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold border ${getRiskColor(dec.riskLevel)}`}>
                    Risk: {dec.riskLevel}
                  </span>
                </div>
              </div>

              {/* Description & Recommendation */}
              <div className="space-y-2 text-[10px] leading-relaxed">
                <p className="text-slate-400">{dec.description}</p>
                <div className="p-2.5 rounded-xl bg-indigo-600/5 border border-indigo-500/10 text-slate-300">
                  <span className="font-extrabold text-indigo-400 text-[8.5px] block mb-0.5">AI Recommendation</span>
                  {dec.recommendation}
                </div>
              </div>

              {/* Lifecycle Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-900">
                <div className="flex items-center gap-2 text-[8px] text-slate-500">
                  <span>작성자: {dec.owner}</span>
                  <span>•</span>
                  <span>신뢰도: {Math.round(dec.confidence * 100)}%</span>
                </div>

                <div className="flex gap-2">
                  {dec.status === 'Generated' && (
                    <button
                      onClick={() => handleStatusChange(dec.id, 'Approved')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold transition-all active:scale-95"
                    >
                      의사결정 승인
                    </button>
                  )}
                  {dec.status === 'Approved' && (
                    <button
                      onClick={() => handleStatusChange(dec.id, 'Executed')}
                      className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[9px] font-bold transition-all active:scale-95"
                    >
                      실행 완료 처리
                    </button>
                  )}
                  {dec.status === 'Executed' && (
                    <button
                      onClick={() => setSelectedDec(dec)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold transition-all flex items-center gap-1 active:scale-95"
                    >
                      <ThumbsUp size={10} /> 피드백 등록 (학습)
                    </button>
                  )}
                  {dec.status === 'Learned' && (
                    <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                      <Star size={10} fill="currentColor" />
                      <span>학습 평가점수: {dec.learningScore}점</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Dialog Modal */}
      {selectedDec && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <form 
            onSubmit={handleFeedbackSubmit}
            className="glass max-w-sm w-full p-5 rounded-2xl border border-slate-800/80 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Star size={18} fill="currentColor" />
              <h3 className="text-xs font-bold uppercase tracking-wider">의사결정 피드백 학습</h3>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              "{selectedDec.title}" 의사결정의 실제 실행 결과를 기록합니다. AI는 이 피드백을 통해 다음 의사결정의 신뢰도를 보정합니다.
            </p>

            <div className="space-y-1.5 pt-2">
              <label className="text-[9px] font-bold text-slate-500 block">만족도 (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                  >
                    <Star size={18} fill={feedbackRating >= star ? '#fbbf24' : 'none'} className={feedbackRating >= star ? 'text-amber-400' : 'text-slate-600'} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 block">실행 피드백/의견</label>
              <textarea
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                placeholder="예: 예산 한도 내에서 완벽하게 집행 완료되었습니다."
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-[10px] text-white focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDec(null)}
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white py-2 rounded-xl text-[10px] font-bold transition-all"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submittingFeedback || !feedbackComments.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white py-2 rounded-xl text-[10px] font-bold transition-all"
              >
                {submittingFeedback ? '학습 등록 중...' : '피드백 제출'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
