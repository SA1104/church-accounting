import { EvidenceTypeBadge } from './StockBadges';

export function DualCloseCard({ stockName, krxValue, nxtValue, isKrxFinal, isNxtFinal }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <h3 className="font-extrabold text-slate-900 text-sm">{stockName}</h3>
        <EvidenceTypeBadge type="FACT" />
      </div>
      
      <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100">
        <div className="flex flex-col gap-1 pr-4">
          <span className="text-[10px] text-slate-500 font-bold">KRX 정규장 {isKrxFinal ? '(최종)' : '(진행중)'}</span>
          <span className={`text-lg font-bold ${krxValue ? 'text-slate-900' : 'text-slate-400'}`}>
            {krxValue || '--'}
          </span>
        </div>
        
        <div className="flex flex-col gap-1 pl-4">
          <span className="text-[10px] text-slate-500 font-bold">NXT 애프터 {isNxtFinal ? '(최종)' : '(진행중)'}</span>
          <span className={`text-lg font-bold ${nxtValue ? 'text-indigo-600' : 'text-slate-400'}`}>
            {nxtValue || '--'}
          </span>
        </div>
      </div>
    </div>
  );
}
