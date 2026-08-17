import { useState, useEffect } from 'react';
import { useStockSearch } from '../hooks/useStockSearch';
import { isMockMode } from '../api/stockApi';
import StockSearchBar from '../components/StockSearchBar';
import StockFilterBar from '../components/StockFilterBar';
import StockResultTable from '../components/StockResultTable';
import StockResultCard from '../components/StockResultCard';
import { DataFreshnessBadge } from "../components/StockBadges";
import { AlertTriangle, Database, Search } from 'lucide-react';

export default function StockSearchPage() {
  const { query, setQuery, setMarket, status, data, meta, error, refetch } = useStockSearch('');
  const [marketFilter, setMarketFilter] = useState('ALL');

  useEffect(() => {
    setMarket(marketFilter === 'ALL' ? '' : `KRX_${marketFilter}`);
  }, [marketFilter, setMarket]);

  const filters = [
    { value: 'ALL', label: '전체' },
    { value: 'KOSPI', label: 'KOSPI' },
    { value: 'KOSDAQ', label: 'KOSDAQ' },
  ];

  return (
    <div>
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-white">종목 검색</h1>
          <p className="text-xs text-slate-400">관심 있는 종목을 검색하고 비교해보세요.</p>
        </div>
        
        <StockSearchBar value={query} onChange={setQuery} />
        
        <div className="flex justify-between items-center flex-wrap gap-2 pt-2">
          <StockFilterBar filters={filters} activeFilter={marketFilter} onFilterChange={setMarketFilter} />
          {meta?.asOfAt && (
            <DataFreshnessBadge 
              timestamp={meta.asOfAt} 
              status={meta.freshnessStatus || 'UNKNOWN'}
            />
          )}
        </div>

        {isMockMode() && (
          <div className="bg-blue-900/20 text-blue-400 text-xs px-3 py-2 rounded-lg border border-blue-500/20 mb-2 font-semibold">
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
              <p className="text-sm font-semibold text-slate-300">시장 데이터 연결 준비 중</p>
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

        {status === 'empty' && (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 text-center space-y-3">
            <Search size={32} className="opacity-50" />
            <p className="text-sm">검색 결과가 없습니다.</p>
          </div>
        )}

        {status === 'success' && data && (
          <>
            <div className="text-xs text-slate-500 mb-2">검색 결과 {data.length}건</div>
            <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-xl p-2">
              <StockResultTable stocks={data} />
            </div>
            <div className="block md:hidden">
              <StockResultCard stocks={data} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
