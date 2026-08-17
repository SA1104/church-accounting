
export default function StockMetricCard({ title, value, subValue }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
      <span className="text-[10px] text-slate-400">{title}</span>
      <span className="font-bold text-white text-sm">{value}</span>
      {subValue && <span className="text-[10px] text-slate-500">{subValue}</span>}
    </div>
  );
}
