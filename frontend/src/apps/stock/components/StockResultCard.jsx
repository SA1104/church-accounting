import { Link } from 'react-router-dom';

export default function StockResultCard({ stocks }) {
  return (
    <div className="flex flex-col gap-3">
      {stocks.map(stock => {
        const isUp = Number(stock.change_rate) > 0;
        const isDown = Number(stock.change_rate) < 0;
        const colorClass = isUp ? 'text-rose-600' : isDown ? 'text-blue-600' : 'text-slate-900';
        const changeSign = isUp ? '+' : '';
        const marketName = stock.market_code === 'KRX_KOSPI' ? 'KOSPI' : stock.market_code === 'KRX_KOSDAQ' ? 'KOSDAQ' : stock.market_code;
        return (
          <Link key={stock.stock_code} to={`/stock/stocks/${stock.stock_code}`} className="bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center hover:bg-slate-50 transition-colors shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-slate-900">{stock.instrument_name}</span>
              <div className="flex gap-2 text-[10px] text-slate-500">
                <span>{stock.stock_code}</span>
                <span>{marketName}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`font-bold text-sm ${colorClass}`}>
                {stock.close_price ? Number(stock.close_price).toLocaleString() : '--'} 원
              </span>
              <span className={`text-xs font-semibold ${colorClass}`}>
                {stock.change_amount ? `${changeSign}${Number(stock.change_amount).toLocaleString()} 원 (${changeSign}${Number(stock.change_rate).toFixed(2)}%)` : '--'}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
