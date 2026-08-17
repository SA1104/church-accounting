
export function MarketSummaryCard({ title, value, changeRate, changeAmount, status }) {
  const isUp = changeRate > 0;
  const isDown = changeRate < 0;
  const color = isUp ? 'text-rose-400' : isDown ? 'text-blue-400' : 'text-slate-400';
  const sign = isUp ? '+' : '';

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-300">{title}</h3>
        <span className="text-[10px] text-slate-500 px-1.5 py-0.5 bg-slate-800 rounded font-semibold">{status}</span>
      </div>
      <div>
        <div className={`text-xl font-extrabold ${color}`}>
          {value || '--'}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className={`text-xs font-bold ${color}`}>
            {changeRate ? `${sign}${changeRate}%` : '--%'}
          </span>
          <span className="text-[10px] text-slate-500">
            {changeAmount ? `${sign}${changeAmount}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
