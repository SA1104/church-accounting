import { Link } from 'react-router-dom';

export default function StockResultTable({ stocks }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg">종목명</th>
            <th className="px-4 py-3 text-right">최근 종가</th>
            <th className="px-4 py-3 text-right">전일비</th>
            <th className="px-4 py-3 text-right">거래량</th>
            <th className="px-4 py-3 text-right rounded-tr-lg">시가총액</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map(stock => {
            const isUp = Number(stock.changeRate) > 0;
            const isDown = Number(stock.changeRate) < 0;
            const colorClass = isUp ? 'text-rose-600' : isDown ? 'text-blue-600' : 'text-slate-900';
            const changeSign = isUp ? '+' : '';
            return (
              <tr key={stock.stockCode} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/stock/stocks/${stock.stockCode}`} className="flex flex-col">
                    <span className="font-bold text-slate-900 hover:text-indigo-600 transition-colors">{stock.instrumentName}</span>
                    <span className="text-[10px] text-slate-500">{stock.stockCode} {stock.marketCode === 'KRX_KOSPI' ? 'KOSPI' : stock.marketCode === 'KRX_KOSDAQ' ? 'KOSDAQ' : stock.marketCode}</span>
                  </Link>
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${colorClass}`}>
                  {stock.closePrice != null ? Number(stock.closePrice).toLocaleString() : '--'} 원
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${colorClass}`}>
                  {stock.changeAmount != null ? `${changeSign}${Number(stock.changeAmount).toLocaleString()} 원 (${changeSign}${Number(stock.changeRate).toFixed(2)}%)` : '--'}
                </td>
                <td className="px-4 py-3 text-right">
                  {stock.volume != null ? Number(stock.volume).toLocaleString() : '--'} 주
                </td>
                <td className="px-4 py-3 text-right">
                  {stock.marketCap != null ? (Number(stock.marketCap) / 100000000).toLocaleString(undefined, {maximumFractionDigits: 0}) : '--'} 억원
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
