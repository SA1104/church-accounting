import { EvidenceTypeBadge } from './StockBadges';

export function DualCloseCard({ stockName, krxValue, nxtValue, isKrxFinal, isNxtFinal }) {
  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
        <h3 className="font-extrabold text-white text-sm">{stockName}</h3>
        <EvidenceTypeBadge type="FACT" />
      </div>
      
      <div className="grid grid-cols-2 gap-4 divide-x divide-slate-800">
        <div className="flex flex-col gap-1 pr-4">
          <span className="text-[10px] text-slate-500 font-bold">KRX 정규장 {isKrxFinal ? '(최종)' : '(진행중)'}</span>
          <span className={`text-lg font-bold ${krxValue ? 'text-white' : 'text-slate-600'}`}>
            {krxValue || '--'}
          </span>
        </div>
        
        <div className="flex flex-col gap-1 pl-4">
          <span className="text-[10px] text-slate-500 font-bold">NXT 애프터 {isNxtFinal ? '(최종)' : '(진행중)'}</span>
          <span className={`text-lg font-bold ${nxtValue ? 'text-blue-400' : 'text-slate-600'}`}>
            {nxtValue || '--'}
          </span>
        </div>
      </div>
    </div>
  );
}
