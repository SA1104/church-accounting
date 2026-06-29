import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, ArrowRight, Zap, Cpu, Settings, FileText, PlusCircle, BarChart2, ShieldCheck } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);

  const items = [
    { name: '전표 등록 (회계)', category: 'Church Think', route: '/vouchers/new', icon: <PlusCircle size={14} className="text-indigo-400" /> },
    { name: '전표 목록 조회', category: 'Church Think', route: '/vouchers', icon: <FileText size={14} className="text-indigo-400" /> },
    { name: '장부 및 결산 현황', category: 'Church Think', route: '/reports', icon: <BarChart2 size={14} className="text-indigo-400" /> },
    { name: '감사위원회 관리', category: 'Church Think', route: '/audit', icon: <ShieldCheck size={14} className="text-indigo-400" /> },
    { name: 'Stock Think (AI 주식 분석)', category: 'Capabilities', route: '/app/stock', icon: <Zap size={14} className="text-emerald-400" /> },
    { name: 'Estate Think (AI 부동산 분석)', category: 'Capabilities', route: '/app/estate', icon: <Zap size={14} className="text-violet-400" /> },
    { name: 'Mission Think (AI 스마트 선교)', category: 'Capabilities', route: '/app/mission', icon: <Zap size={14} className="text-cyan-400" /> },
    { name: '환경설정', category: 'Platform', route: '/settings', icon: <Settings size={14} className="text-slate-400" /> },
    { name: 'AI 코파일럿에게 질문하기', category: 'AI Assistant', route: '/', icon: <Cpu size={14} className="text-purple-400" /> }
  ];

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
            placeholder="무엇을 하시겠습니까? (메뉴명, 기능 검색...)"
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
              {/* Grouped by category */}
              {Array.from(new Set(filteredItems.map(i => i.category))).map(category => (
                <div key={category} className="space-y-1.5">
                  <h4 className="text-[8px] font-black tracking-widest text-slate-600 uppercase px-2 pt-2.5">
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
          <span>BOOZA THINK COMMAND PALETTE</span>
          <span className="flex items-center gap-1">
            <Command size={10} /> + K
          </span>
        </div>
      </div>
    </div>
  );
}
