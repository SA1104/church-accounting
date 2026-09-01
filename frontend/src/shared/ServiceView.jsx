import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Newspaper, BarChart2, MessageSquare, Flame } from 'lucide-react';

const SERVICE_META = {
  'stock': { title: '주식', desc: '국내/해외 주식 시장 이슈 및 가치 평가' },
  'real_estate': { title: '부동산', desc: '부동산 정책, 실거래가 및 입지 분석' },
  'politics': { title: '정치', desc: '정치 핫이슈 및 정책 분석' },
  'economy': { title: '경제', desc: '거시 경제 동향 및 지표 분석' },
  'mission': { title: '선교', desc: '선교지 소식 및 환율/안전 지표 분석' },
  'word_sharing': { title: '말씀 나눔', desc: '말씀 묵상 및 커뮤니티' },
};

export default function ServiceView() {
  const { serviceId } = useParams();
  const [activeTab, setActiveTab] = useState('today');

  const meta = SERVICE_META[serviceId] || { title: '서비스', desc: '알 수 없는 서비스' };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">{meta.title} Think</h1>
          <p className="text-sm text-slate-400 mt-1">{meta.desc}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl w-fit border border-slate-800">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'today' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Newspaper size={16} /> 오늘의 {meta.title} 시장
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'analysis' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BarChart2 size={16} /> {meta.title} 분석
        </button>
        <button
          onClick={() => setActiveTab('board')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'board' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MessageSquare size={16} /> 게시판
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px] border border-slate-800 bg-slate-900/20 rounded-2xl p-6 relative overflow-hidden">
        {activeTab === 'today' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame size={18} className="text-rose-500" /> 실시간 핫이슈
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-colors">
                  <div className="text-xs text-indigo-400 font-bold mb-1">온라인 뉴스 크롤링 대기중</div>
                  <div className="text-sm font-bold text-slate-200">{meta.title} 관련 주요 뉴스 타이틀 {i}</div>
                  <div className="text-xs text-slate-500 mt-2 line-clamp-2">
                    여기에 외부 뉴스 API나 크롤링을 통해 수집된 요약 데이터가 표시됩니다. 아웃링크 방식으로 저작권 문제를 회피합니다.
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 size={18} className="text-emerald-500" /> 고정 분석 대시보드
            </h2>
            <div className="h-64 w-full rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30">
              <BarChart2 size={32} className="mb-2 opacity-50" />
              <p className="text-sm font-bold">RAW DATA 기반 분석 차트/위젯 영역</p>
              <p className="text-xs mt-1">각 서비스별(주식, 부동산 등)로 특화된 분석 데이터가 시각화됩니다.</p>
            </div>
          </div>
        )}

        {activeTab === 'board' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-500" /> 자유 게시판
              </h2>
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
                글쓰기
              </button>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-200 truncate">{meta.title}에 대한 제 생각은 이렇습니다.</div>
                    <div className="text-xs text-slate-500 mt-1">익명 사용자 • 2시간 전 • 조회 15</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
