import { Link } from 'react-router-dom';

export default function StockResultTable({ stocks }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg">종목명</th>
            <th className="px-4 py-3 text-right">현재가</th>
            <th className="px-4 py-3 text-right">전일비</th>
            <th className="px-4 py-3 text-right">거래량</th>
            <th className="px-4 py-3 text-right rounded-tr-lg">시가총액</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map(stock => (
            <tr key={stock.stockCode} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3">
                <Link to={`/stock/stocks/${stock.stockCode}`} className="flex flex-col">
                  <span className="font-bold text-slate-900 hover:text-indigo-600 transition-colors">{stock.name}</span>
                  <span className="text-[10px] text-slate-500">{stock.stockCode}</span>
                </Link>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-slate-900">-- 원</td>
              <td className="px-4 py-3 text-right font-semibold text-slate-400">-- %</td>
              <td className="px-4 py-3 text-right">-- 주</td>
              <td className="px-4 py-3 text-right">-- 억원</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
