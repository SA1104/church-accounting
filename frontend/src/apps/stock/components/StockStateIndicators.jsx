import { Loader2, AlertTriangle, Sparkles } from 'lucide-react';

export function StockLoadingState({ message = '시장 데이터를 불러오는 중...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-slate-400">
      <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function StockErrorState({ message = '데이터를 불러올 수 없습니다.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
      <AlertTriangle size={32} className="mb-3 text-rose-500 opacity-80" />
      <p className="text-sm text-slate-300 mb-4">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

export function StockEmptyState({ message = '표시할 내용이 없습니다.', subMessage }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
        <Sparkles size={20} className="text-slate-500" />
      </div>
      <p className="text-sm font-medium text-slate-300">{message}</p>
      {subMessage && <p className="text-xs text-slate-500 mt-1">{subMessage}</p>}
    </div>
  );
}

export function StockFeaturePlaceholder({ title }) {
  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-10">
      <h1 className="text-xl font-extrabold text-white">{title}</h1>
      <div className="glass rounded-2xl p-10 flex flex-col items-center justify-center text-center border border-slate-800/50">
        <Sparkles size={32} className="text-indigo-500 mb-4 opacity-50" />
        <h2 className="text-lg font-bold text-slate-200 mb-2">1B단계 구현 예정입니다</h2>
        <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
          {title} 기능은 현재 1A 골격 검증을 위해 Placeholder 상태입니다. 다음 단계에서 상세 구현됩니다.
        </p>
      </div>
    </div>
  );
}
