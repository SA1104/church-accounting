
export default function StockMetricCard({ title, value, subValue }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
      <span className="text-[10px] text-slate-500">{title}</span>
      <span className="font-bold text-slate-900 text-sm">{value}</span>
      {subValue && <span className="text-[10px] text-slate-400">{subValue}</span>}
    </div>
  );
}
