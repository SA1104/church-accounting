
export default function StockComparisonSelector({ selected, onChange }) {
  return (
    <select 
      value={selected} 
      onChange={e => onChange(e.target.value)}
      className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
    >
      <option value="none">비교 대상 선택</option>
      <option value="kospi">KOSPI 지수</option>
      <option value="kosdaq">KOSDAQ 지수</option>
      <option value="sector">동일 업종 지수</option>
    </select>
  );
}
