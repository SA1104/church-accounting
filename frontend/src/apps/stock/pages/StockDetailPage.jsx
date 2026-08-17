import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStockDetail } from '../hooks/useStockDetail';
import { isMockMode } from '../api/stockApi';
import { DualCloseCard } from "../components/DualCloseCard";
import StockChartPlaceholder from '../components/StockChartPlaceholder';
import StockComparisonSelector from '../components/StockComparisonSelector';
import StockMetricCard from '../components/StockMetricCard';
import CommunityPostCard from '../components/CommunityPostCard';
import StockAccessNotice from '../components/StockAccessNotice';
import { DataFreshnessBadge } from "../components/StockBadges";
import { MarketStatusBadge } from "../components/StockBadges";
import { mockCommunityPosts } from '../data/stockUiPlaceholderData';
import { BookmarkPlus, Share2, AlertTriangle, Database, ChevronLeft } from 'lucide-react';

export default function StockDetailPage() {
  const { stockCode } = useParams();
  const { status, instrument, latestBar, bars, meta, error, refetch } = useStockDetail(stockCode);
  const [comparison, setComparison] = useState('kospi');
  
  if (status === 'loading') {
    return <div className="flex justify-center py-20"><span className="text-slate-500">Loading...</span></div>;
  }

  if (status === 'data_not_ready') {
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-5xl mx-auto space-y-4">
        <Database size={48} className="text-amber-500 opacity-80" />
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900 mb-1">시장 데이터 연결 준비 중</p>
          <p className="text-sm text-slate-500">{error || '데이터베이스 갱신이 필요합니다.'}</p>
        </div>
        <div className="flex gap-2 mt-4">
          <Link to="/stock" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
            이전으로
          </Link>
          <button onClick={refetch} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-5xl mx-auto space-y-4">
        <AlertTriangle size={48} className="text-rose-500 opacity-80" />
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900 mb-1">데이터 오류</p>
          <p className="text-sm text-slate-500">{error || '알 수 없는 오류가 발생했습니다.'}</p>
        </div>
        <button onClick={refetch} className="px-4 py-2 mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
          다시 시도
        </button>
      </div>
    );
  }

  if (status === 'success' && !instrument) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-slate-500 mb-2 font-bold">찾을 수 없는 종목코드입니다: {stockCode}</div>
        <p className="text-sm text-slate-500">올바른 종목코드인지 확인해주세요.</p>
        <Link to="/stock" className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  if (!instrument) return null;

  return (
    <div>
      <div className="max-w-5xl mx-auto space-y-6">
        <Link to="/stock/stocks" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2">
          <ChevronLeft size={14} className="mr-1" /> 종목 검색으로
        </Link>
        
        {isMockMode() && (
          <div className="bg-indigo-50 text-indigo-700 text-xs px-3 py-2 rounded-lg border border-indigo-200 mb-2 font-semibold shadow-sm">
            UI 예시 · 실제 시장 데이터가 아닙니다
          </div>
        )}

        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-slate-900">{instrument.instrument_name}</h1>
              <span className="text-sm text-slate-500 font-semibold">{instrument.stock_code}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{instrument.market_code}</span>
              <span>·</span>
              <span>COMMON</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm rounded-lg text-xs font-semibold transition-colors">
              <Share2 size={14} /> 공유
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow shadow-blue-600/20">
              <BookmarkPlus size={14} /> 관심 종목
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <MarketStatusBadge status="OPEN" />
            {meta?.asOfAt && (
              <DataFreshnessBadge 
                timestamp={meta.asOfAt} 
                status={meta.freshnessStatus || 'UNKNOWN'}
              />
            )}
            {meta && meta.isFinal === false && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 shadow-sm">
                미확정
              </span>
            )}
          </div>
          <DualCloseCard 
            krxClose={latestBar?.close_price ? Number(latestBar.close_price) : null} 
            nxtClose={null} 
            krxTime="KRX 종가" 
            nxtTime="NXT 데이터 연결 준비 중" 
          />
        </div>

        <StockAccessNotice />

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <h2 className="text-base font-bold text-slate-900">가격 흐름 <span className="text-slate-500 text-xs font-normal ml-2">{bars.length}일 데이터</span></h2>
            <StockComparisonSelector selected={comparison} onChange={setComparison} />
          </div>
          {bars.length > 0 ? (
            <StockChartPlaceholder height="300px" />
          ) : (
            <div className="h-[300px] bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 text-sm shadow-sm">
              일별 데이터가 없습니다.
            </div>
          )}
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 mb-3">핵심 지표</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StockMetricCard title="거래량" value={latestBar?.volume ? Number(latestBar.volume).toLocaleString() : '--'} subValue="주" />
            <StockMetricCard title="거래대금" value={latestBar?.trading_value ? (Number(latestBar.trading_value)/100000000).toLocaleString(undefined, {maximumFractionDigits:0}) : '--'} subValue="억 원" />
            <StockMetricCard title="시가" value={latestBar?.open_price ? Number(latestBar.open_price).toLocaleString() : '--'} />
            <StockMetricCard title="고가" value={latestBar?.high_price ? Number(latestBar.high_price).toLocaleString() : '--'} />
            <StockMetricCard title="저가" value={latestBar?.low_price ? Number(latestBar.low_price).toLocaleString() : '--'} />
            <StockMetricCard title="52주 최고" value="--" />
            <StockMetricCard title="52주 최저" value="--" />
            <StockMetricCard title="시가총액" value="--" subValue="-- 억 원" />
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 mb-3">공시 및 뉴스</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm shadow-sm">
            데이터 연결 준비 중입니다.
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-slate-900">관련 분석글</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mockCommunityPosts.filter(p => p.stockCode === stockCode).length > 0 ? (
              mockCommunityPosts.filter(p => p.stockCode === stockCode).map(post => (
                <CommunityPostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm shadow-sm">
                관련 분석글이 없습니다.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 text-[10px] text-slate-500 space-y-1">
          <p>※ 본 서비스에서 제공하는 정보는 투자 참고용이며, 실제 데이터와 차이가 있을 수 있습니다.</p>
          <p>※ 주식 투자의 최종 결정은 투자자 본인에게 있으며, 투자 결과에 대한 법적 책임을 지지 않습니다.</p>
        </div>
      </div>
    </div>
  );
}
