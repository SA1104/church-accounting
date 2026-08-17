import { Info } from 'lucide-react';

export default function StockAccessNotice() {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3 shadow-sm">
      <Info className="text-indigo-600 shrink-0 mt-0.5" size={16} />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold text-slate-900">현재 UI 예시(Mock Data) 화면입니다.</span>
        <span className="text-[10px] text-slate-500">이 화면은 누구나 접근 가능한 공개 라우트이며, 실제 금융 데이터 연동은 2A 단계에서 진행됩니다.</span>
      </div>
    </div>
  );
}
