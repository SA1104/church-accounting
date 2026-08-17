import { useStockMarket } from '../hooks/useStockMarket';
import { isMockMode } from '../api/stockApi';
import { SectionHeader } from '../components/SectionHeader';
import { DataFreshnessBadge } from '../components/StockBadges';
import { Database, AlertTriangle } from 'lucide-react';

export default function KoreaMarketPage() {
  const { status, koreaLatest, meta, error, refetch } = useStockMarket();

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <SectionHeader title="한국 시장" description="코스피, 코스닥 지수 및 투자자 매매동향" />
        {meta?.asOfAt && (
          <DataFreshnessBadge 
            timestamp={meta.asOfAt} 
            status={meta.freshnessStatus || 'UNKNOWN'}
          />
        )}
      </div>
      
      {isMockMode() && (
        <div className="bg-blue-900/20 text-blue-400 text-xs px-3 py-2 rounded-lg border border-blue-500/20 mb-2 font-semibold inline-block">
          UI 예시 · 실제 시장 데이터가 아닙니다
        </div>
      )}

      {status === 'loading' && (
        <div className="flex justify-center p-8"><span className="text-slate-400">Loading...</span></div>
      )}

      {status === 'data_not_ready' && (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 text-center space-y-3">
          <Database size={32} className="text-amber-500 opacity-80" />
          <div>
            <p className="text-sm font-semibold text-slate-300">지수 데이터 수집 준비 중</p>
            <p className="text-xs mt-1">{error || '데이터베이스 갱신이 필요합니다.'}</p>
          </div>
          <button onClick={refetch} className="px-3 py-1.5 mt-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs">
            다시 시도
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900 rounded-xl border border-rose-500/20 text-slate-400 text-center space-y-3">
          <AlertTriangle size={32} className="text-rose-500 opacity-80" />
          <div>
            <p className="text-sm font-semibold text-slate-300">데이터를 불러오지 못했습니다</p>
            <p className="text-xs mt-1 text-rose-400">{error}</p>
          </div>
          <button onClick={refetch} className="px-3 py-1.5 mt-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs">
            다시 시도
          </button>
        </div>
      )}

      {status === 'success' && koreaLatest && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-center items-center">
            <div className="text-slate-400 text-sm font-bold mb-2">KOSPI</div>
            <div className="text-3xl font-bold text-white">{koreaLatest.kospi || '지수 데이터 수집 준비 중'}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-center items-center">
            <div className="text-slate-400 text-sm font-bold mb-2">KOSDAQ</div>
            <div className="text-3xl font-bold text-white">{koreaLatest.kosdaq || '지수 데이터 수집 준비 중'}</div>
          </div>
        </div>
      )}

      {status === 'success' && !koreaLatest && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 flex flex-col justify-center items-center text-slate-500 text-sm">
          지수 데이터 수집 준비 중
        </div>
      )}
    </div>
  );
}
