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
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-start gap-3 shadow-sm">
            <AlertCircle size={16} className="text-indigo-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              <strong>실제 데이터 연결 준비 중입니다.</strong><br/>
              현재 화면은 반응형 레이아웃 확인을 위한 UI 예시이며 실제 시장 데이터가 아닙니다.
            </p>
          </div>
        )}

        {status === 'data_not_ready' && (
           <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3 shadow-sm">
             <Database size={16} className="text-amber-600 mt-0.5 shrink-0" />
             <div className="text-[11px] text-amber-800 leading-relaxed w-full">
               <strong>시장 데이터베이스 연결 준비 중입니다.</strong><br/>
               <span className="text-amber-700/80">{error}</span>
               <div className="mt-2 text-right">
                 <button onClick={refetch} className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-700 border border-amber-200 rounded font-semibold transition-colors shadow-sm">
                   다시 연결 시도
                 </button>
               </div>
             </div>
           </div>
        )}

        {status === 'error' && (
           <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-3 shadow-sm">
             <AlertTriangle size={16} className="text-rose-600 mt-0.5 shrink-0" />
             <div className="text-[11px] text-rose-800 leading-relaxed w-full">
               <strong>데이터를 불러오는 중 오류가 발생했습니다.</strong><br/>
               <span className="text-rose-700/80">{error}</span>
               <div className="mt-2 text-right">
                 <button onClick={refetch} className="px-3 py-1 bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-semibold transition-colors shadow-sm">
                   재시도
                 </button>
               </div>
             </div>
           </div>
        )}

      </section>

      <section>
        <SectionHeader title="오늘의 핵심 요약" description="AI가 분석한 시장 주도 테마 및 흐름" />
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
          <p className="text-sm text-slate-500">지수 데이터 수집 준비 중</p>
        </div>
      </section>
    </div>
  );
}
