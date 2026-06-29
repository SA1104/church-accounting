import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, ArrowRight, Zap, Cpu, Settings, FileText, PlusCircle, BarChart2, ShieldCheck } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);

  const items = [
    // 1. Decisions (우선순위 1)
    { name: '교육부서 여름 성경학교 행사 예산 승인 [Decision]', category: 'Decisions', route: '/decisions', icon: <ShieldCheck size={14} className="text-indigo-400" /> },
    { name: '삼성전자 분기 배당 가치 기반 추가 매수 추천 [Decision]', category: 'Decisions', route: '/decisions', icon: <ShieldCheck size={14} className="text-emerald-400" /> },
    { name: '목동 재건축 3단지 실거래가 분석 기반 소형 아파트 매입 [Decision]', category: 'Decisions', route: '/decisions', icon: <ShieldCheck size={14} className="text-violet-400" /> },

    // 2. Reports (우선순위 2)
    { name: '6월 재정 결산 분석 보고서 [Report]', category: 'Reports', route: '/reports', icon: <FileText size={14} className="text-indigo-400" /> },
    { name: '교회 통합 회계 장부 조회 [Report]', category: 'Reports', route: '/reports', icon: <BarChart2 size={14} className="text-indigo-400" /> },
    { name: '삼성전자 분기 실적 및 배당 분석 [Report]', category: 'Reports', route: '/app/stock', icon: <FileText size={14} className="text-emerald-400" /> },
    
    // 3. Tools (우선순위 3)
    { name: '전표 등록 도구 (회계)', category: 'Tools', route: '/vouchers/new', icon: <PlusCircle size={14} className="text-indigo-400" /> },
    { name: '전표 목록 관리', category: 'Tools', route: '/vouchers', icon: <FileText size={14} className="text-indigo-400" /> },
    { name: '정기 감사위원회 모니터링', category: 'Tools', route: '/audit', icon: <ShieldCheck size={14} className="text-indigo-400" /> },

    // 4. Plugins (우선순위 4)
    { name: 'Church Think (교회 의사결정 App)', category: 'Plugins', route: '/app/church', icon: <Zap size={14} className="text-indigo-400" /> },
    { name: 'Stock Think (투자 의사결정 App)', category: 'Plugins', route: '/app/stock', icon: <Zap size={14} className="text-emerald-400" /> },
    { name: 'Estate Think (부동산 의사결정 App)', category: 'Plugins', route: '/app/estate', icon: <Zap size={14} className="text-violet-400" /> },
    { name: 'Mission Think (선교 의사결정 App)', category: 'Plugins', route: '/app/mission', icon: <Zap size={14} className="text-cyan-400" /> },

    // 5. Settings (우선순위 5)
    { name: '환경설정 및 권한 관리', category: 'Settings', route: '/settings', icon: <Settings size={14} className="text-slate-400" /> }
  ];

  const categoryOrder = ['Decisions', 'Reports', 'Tools', 'Plugins', 'Settings'];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (route) => {
    onClose();
    navigate(route);
  };

  const activeCategories = categoryOrder.filter(cat => 
    filteredItems.some(i => i.category === cat)
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-24 z-50 p-6" onClick={onClose}>
      <div 
        className="glass max-w-lg w-full p-4 rounded-2xl border border-slate-800/80 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="relative flex items-center border-b border-slate-900 pb-3">
          <Search size={16} className="text-slate-500 absolute left-3" />
          <input 
            ref={inputRef}
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색어를 입력하세요... (예: 삼성전자, 예산, 전표 등)"
            className="w-full bg-transparent pl-10 pr-12 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <div className="absolute right-2 flex items-center gap-1 text-[9px] bg-slate-900 border border-slate-800 text-slate-500 font-bold px-1.5 py-0.5 rounded">
            ESC
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-60 overflow-y-auto no-scrollbar space-y-3">
          {filteredItems.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-6">검색 결과가 없습니다.</p>
          ) : (
            <div>
              {/* Grouped by strict category order */}
              {activeCategories.map(category => (
                <div key={category} className="space-y-1.5 mb-2.5">
                  <h4 className="text-[8px] font-black tracking-widest text-slate-500 uppercase px-2 pt-1 border-b border-slate-900/35 pb-1">
                    {category}
                  </h4>
                  {filteredItems.filter(i => i.category === category).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(item.route)}
                      className="w-full text-left p-2 rounded-xl hover:bg-indigo-600/10 hover:border-indigo-500/20 text-slate-300 hover:text-white transition-all flex items-center justify-between border border-transparent"
                    >
                      <div className="flex items-center gap-2.5 text-xs font-semibold">
                        {item.icon}
                        <span>{item.name}</span>
                      </div>
                      <ArrowRight size={11} className="text-slate-600 group-hover:text-white" />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[8px] text-slate-600 font-bold tracking-widest pt-2 border-t border-slate-900">
          <span>BOOZA THINK DECISION SYSTEM</span>
          <span className="flex items-center gap-1">
            <Command size={10} /> + K
          </span>
        </div>
      </div>
    </div>
  );
}
