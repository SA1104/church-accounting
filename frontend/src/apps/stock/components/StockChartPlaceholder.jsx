import { LineChart } from 'lucide-react';

export default function StockChartPlaceholder({ height = '300px' }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500 shadow-sm" style={{ height }}>
      <LineChart size={48} strokeWidth={1} className="mb-4 opacity-50" />
      <span className="text-sm font-semibold">차트 준비중(UI 예시)</span>
      <span className="text-xs mt-2">2A 단계에서 라이브러리 연동 예정</span>
    </div>
  );
}
