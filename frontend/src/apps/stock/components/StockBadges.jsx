import { Database, Activity } from 'lucide-react';

export function MarketStatusBadge({ status }) {
  const getBadge = () => {
    switch (status) {
      case 'OPEN': return { text: '시장 열림', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
      case 'CLOSED': return { text: '시장 마감', color: 'bg-slate-100 text-slate-500 border-slate-200' };
      default: return { text: '상태 대기', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    }
  };
  const b = getBadge();
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${b.color}`}>{b.text}</span>;
}

export function DataFreshnessBadge({ timestamp }) {
  return (
    <div className="flex items-center gap-1 text-[10px] text-slate-600 font-semibold bg-white border border-slate-200 px-2 py-1 rounded-full shadow-sm">
      <Activity size={10} className="text-indigo-500" />
      <span>{timestamp ? new Date(timestamp).toLocaleTimeString() : '데이터 연결 대기'}</span>
    </div>
  );
}

export function EvidenceTypeBadge({ type }) {
  if (type === 'FACT') {
    return (
      <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
        <Database size={10} /> 팩트
      </span>
    );
  }
  return null;
}
