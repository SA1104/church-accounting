import { Clock } from 'lucide-react';

export function MarketSessionBar({ session, remainingTime }) {
  const getStatusDisplay = () => {
    switch(session) {
      case 'OPEN': return { text: '정규장 열림', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'PRE_MARKET': return { text: '장전 동시호가', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'AFTER_MARKET': return { text: '장후 시간외', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'CLOSED': return { text: '장 마감', color: 'bg-slate-800 text-slate-400 border-slate-700' };
      default: return { text: '알 수 없음', color: 'bg-slate-800 text-slate-400 border-slate-700' };
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
