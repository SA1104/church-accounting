import { useState, useEffect } from 'react';
import { useStockMarket } from '../hooks/useStockMarket';
import { isMockMode } from '../api/stockApi';
import { MarketStatusBadge, DataFreshnessBadge } from '../components/StockBadges';
import { SectionHeader } from '../components/SectionHeader';
import { getKoreaMarketSession } from '../utils/marketSession';
import { AlertCircle, Database, AlertTriangle } from 'lucide-react';

export default function StockTodayPage() {
  const { status, meta, error, refetch } = useStockMarket();
  const [session, setSession] = useState('CALENDAR_UNKNOWN');
  
  useEffect(() => {
    setSession(getKoreaMarketSession({ now: new Date(), isTradingDay: null }));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <MarketStatusBadge status={session} />
          {meta?.asOfAt && (
            <DataFreshnessBadge 
              timestamp={meta.asOfAt} 
              status={meta.freshnessStatus || 'UNKNOWN'}
            />
          )}
        </div>
        
        {isMockMode() && (
          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-3 flex items-start gap-3">
            <AlertCircle size={16} className="text-indigo-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-indigo-300 leading-relaxed">
              <strong>실제 데이터 연결 준비 중입니다.</strong><br/>
              현재 화면은 반응형 레이아웃 확인을 위한 UI 예시이며 실제 시장 데이터가 아닙니다.
            </p>
          </div>
        )}

        {status === 'data_not_ready' && (
           <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-3 flex items-start gap-3">
             <Database size={16} className="text-amber-500 mt-0.5 shrink-0" />
             <div className="text-[11px] text-amber-300 leading-relaxed w-full">
               <strong>시장 데이터베이스 연결 준비 중입니다.</strong><br/>
               <span className="text-amber-400/80">{error}</span>
               <div className="mt-2 text-right">
                 <button onClick={refetch} className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-semibold transition-colors">
                   다시 연결 시도
                 </button>
               </div>
             </div>
           </div>
        )}

        {status === 'error' && (
           <div className="bg-rose-900/20 border border-rose-500/30 rounded-xl p-3 flex items-start gap-3">
             <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" />
             <div className="text-[11px] text-rose-300 leading-relaxed w-full">
               <strong>데이터를 불러오는 중 오류가 발생했습니다.</strong><br/>
               <span className="text-rose-400/80">{error}</span>
               <div className="mt-2 text-right">
                 <button onClick={refetch} className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded font-semibold transition-colors">
                   재시도
                 </button>
               </div>
             </div>
           </div>
        )}

      </section>

      <section>
        <SectionHeader title="오늘의 핵심 요약" description="AI가 분석한 시장 주도 테마 및 흐름" />
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 text-center">
          <p className="text-sm text-slate-500">지수 데이터 수집 준비 중</p>
        </div>
      </section>
    </div>
  );
}
