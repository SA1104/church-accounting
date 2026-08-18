import { Link } from 'react-router-dom';

export default function StockResultCard({ stocks }) {
  return (
    <div className="flex flex-col gap-3">
      {stocks.map(stock => {
        const isUp = Number(stock.changeRate) > 0;
        const isDown = Number(stock.changeRate) < 0;
        const colorClass = isUp ? 'text-rose-600' : isDown ? 'text-blue-600' : 'text-slate-900';
        const changeSign = isUp ? '+' : '';
        const marketName = stock.marketCode === 'KRX_KOSPI' ? 'KOSPI' : stock.marketCode === 'KRX_KOSDAQ' ? 'KOSDAQ' : stock.marketCode;
        return (
          <Link key={stock.stockCode} to={`/stock/stocks/${stock.stockCode}`} className="bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center hover:bg-slate-50 transition-colors shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-slate-900">{stock.instrumentName}</span>
              <div className="flex gap-2 text-[10px] text-slate-500">
                <span>{stock.stockCode}</span>
                <span>{marketName}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`font-bold text-sm ${colorClass}`}>
                {stock.closePrice != null ? Number(stock.closePrice).toLocaleString() : '--'} 원
              </span>
              <span className={`text-xs font-semibold ${colorClass}`}>
                {stock.changeAmount != null ? `${changeSign}${Number(stock.changeAmount).toLocaleString()} 원 (${changeSign}${Number(stock.changeRate).toFixed(2)}%)` : '--'}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
