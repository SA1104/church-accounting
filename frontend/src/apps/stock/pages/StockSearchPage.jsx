import { useState, useEffect } from 'react';
import { useStockSearch } from '../hooks/useStockSearch';

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
          <h1 className="text-xl font-extrabold text-slate-900">종목 검색</h1>
          <p className="text-xs text-slate-500">관심 있는 종목을 검색하고 비교해보세요.</p>
        </div>
        
        <StockSearchBar value={query} onChange={setQuery} />
        
        <div className="flex justify-between items-center flex-wrap gap-2 pt-2">
          <StockFilterBar filters={filters} activeFilter={marketFilter} onFilterChange={setMarketFilter} />
          {meta?.asOfDate && (
            <DataFreshnessBadge 
              timestamp={meta.asOfDate} 
              status={meta.freshnessStatus || 'UNKNOWN'}
            />
          )}
        </div>



        {status === 'loading' && (
          <div className="flex justify-center p-12">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div>
              <span className="text-slate-400 text-sm font-semibold">검색 중...</span>
            </div>
          </div>
        )}

        {status === 'data_not_ready' && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 text-slate-500 text-center space-y-3 shadow-sm">
            <Database size={32} className="text-amber-500 opacity-80" />
            <div>
              <p className="text-sm font-semibold text-slate-900">시장 데이터 연결 준비 중</p>
              <p className="text-xs mt-1">{error || '데이터베이스 갱신이 필요합니다.'}</p>
            </div>
            <button onClick={refetch} className="px-3 py-1.5 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors">
              다시 시도
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-rose-200 text-slate-500 text-center space-y-3 shadow-sm">
            <AlertTriangle size={32} className="text-rose-500 opacity-80" />
            <div>
              <p className="text-sm font-semibold text-slate-900">데이터를 불러오지 못했습니다</p>
              <p className="text-xs mt-1 text-rose-600">{error}</p>
            </div>
            <button onClick={refetch} className="px-3 py-1.5 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors">
              다시 시도
            </button>
          </div>
        )}

        {status === 'empty' && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 text-slate-500 text-center space-y-3 shadow-sm">
            <Search size={32} className="opacity-50" />
            <p className="text-sm">검색 결과가 없습니다.</p>
          </div>
        )}

        {status === 'success' && data && (
          <>
            <div className="text-xs text-slate-500 mb-2">검색 결과 {data.length}건</div>
            <div className="hidden md:block bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
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
