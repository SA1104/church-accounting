import { Link } from 'react-router-dom';

export default function StockResultCard({ stocks }) {
  return (
    <div className="flex flex-col gap-3">
      {stocks.map(stock => (
        <Link key={stock.stockCode} to={`/stock/stocks/${stock.stockCode}`} className="bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center hover:bg-slate-50 transition-colors shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-slate-900">{stock.name}</span>
            <div className="flex gap-2 text-[10px] text-slate-500">
              <span>{stock.stockCode}</span>
              <span>{stock.market}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-bold text-slate-900 text-sm">-- 원</span>
            <span className="text-xs font-semibold text-slate-400">-- %</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
