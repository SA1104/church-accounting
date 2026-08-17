import { Clock } from 'lucide-react';

export function MarketSessionBar({ session, remainingTime }) {
  const getStatusDisplay = () => {
    switch(session) {
      case 'OPEN': return { text: '정규장 열림', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
      case 'PRE_MARKET': return { text: '개장 전', color: 'bg-amber-50 text-amber-600 border-amber-200' };
      case 'AFTER_MARKET': return { text: '애프터 마켓', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' };
      case 'CLOSED': return { text: '장 마감', color: 'bg-slate-100 text-slate-500 border-slate-200' };
      default: return { text: '알 수 없음', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="flex items-center gap-2">
      <div className={`px-2 py-1 rounded border ${status.color} text-[10px] font-bold flex items-center gap-1.5`}>
        <Clock size={12} />
        {status.text}
      </div>
      {remainingTime && <span className="text-[10px] text-slate-500 font-semibold">{remainingTime} 남음</span>}
    </div>
  );
}
