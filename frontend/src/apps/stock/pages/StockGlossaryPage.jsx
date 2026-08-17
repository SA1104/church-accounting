import { useState } from 'react';
import StockSearchBar from '../components/StockSearchBar';
import StockFilterBar from '../components/StockFilterBar';
import GlossaryTermList from '../components/GlossaryTermList';
import { mockGlossary } from '../data/stockUiPlaceholderData';

export default function StockGlossaryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  
  const categories = [
    { value: 'ALL', label: '전체' },
    { value: '기초', label: '기초' },
    { value: '지표', label: '투자 지표' },
    { value: '거시', label: '거시 경제' },
  ];

  const filtered = mockGlossary.filter(term => {
    if (category !== 'ALL' && term.category !== category) return false;
    if (search && !term.term.includes(search)) return false;
    return true;
  });

  return (
    <div>
      <div className="space-y-5 max-w-3xl mx-auto">
        <div className="flex flex-col gap-1 text-center py-6">
          <h1 className="text-2xl font-bold text-white">금융 용어 사전</h1>
          <p className="text-sm text-slate-400">어려운 금융 용어를 명확한 사실과 쉬운 예시로 이해하세요.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-col gap-2">
          <StockSearchBar value={search} onChange={setSearch} placeholder="궁금한 용어를 검색하세요 (예: PER, 시가총액)" />
          <div className="px-2 pb-1">
            <StockFilterBar filters={categories} activeFilter={category} onFilterChange={setCategory} />
          </div>
        </div>

        <div className="pt-2">
          <h2 className="text-xs font-bold text-slate-500 mb-3 ml-1">총 {filtered.length}개의 용어 (UI 예시 목데이터)</h2>
          <GlossaryTermList terms={filtered} />
        </div>
      </div>
    </div>
  );
}
