import { useState } from 'react';
import StockFilterBar from '../components/StockFilterBar';
import CommunityPostCard from '../components/CommunityPostCard';
import StockAccessNotice from '../components/StockAccessNotice';
import { mockCommunityPosts } from '../data/stockUiPlaceholderData';
import { PenSquare } from 'lucide-react';

export default function StockCommunityPage() {
  const [sort, setSort] = useState('latest');
  
  const sortOptions = [
    { value: 'latest', label: '최신순' },
    { value: 'comments', label: '댓글 많은 순' },
    { value: 'verified', label: '검증 완료순' },
  ];

  return (
    <div>
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-white">투자 관점 기록 및 검증</h1>
            <p className="text-xs text-slate-400">자신의 투자 시나리오를 기록하고 실제 결과로 검증합니다.</p>
          </div>
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-colors">
            <PenSquare size={16} /> 분석글 작성
          </button>
        </div>

        <StockAccessNotice />

        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <StockFilterBar filters={sortOptions} activeFilter={sort} onFilterChange={setSort} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mockCommunityPosts.map(post => (
            <CommunityPostCard key={post.id} post={post} />
          ))}
        </div>

        <div className="flex justify-center pt-6 pb-10">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button className="px-3 py-1.5 text-xs text-slate-500 hover:text-white rounded">이전</button>
            <button className="px-3 py-1.5 text-xs bg-slate-800 text-white font-bold rounded">1</button>
            <button className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded">2</button>
            <button className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded">3</button>
            <button className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded">다음</button>
          </div>
        </div>
      </div>
    </div>
  );
}
