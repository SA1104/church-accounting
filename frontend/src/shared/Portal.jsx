import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { plugins } from '../core/plugins';
import { 
  Sparkles, 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  Cpu, 
  AlertTriangle,
  TrendingUp,
  Home,
  Globe,
  Plus,
  Scale,
  PieChart,
  BookOpen
} from 'lucide-react';

export default function Portal() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  const [query, setQuery] = useState('');
  const [resolving, setResolving] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [matchedResult, setMatchedResult] = useState(null);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);

  const suggestions = [
    "삼성전자 분석해줘",
    "목동 재건축 추천해줘",
    "금리 인상 이슈 알려줘",
    "오늘 선교지 뉴스"
  ];

  const getPluginIcon = (id) => {
    switch (id) {
      case 'stock': return <TrendingUp size={22} className="text-emerald-400" />;
      case 'real_estate': return <Home size={22} className="text-violet-400" />;
      case 'politics': return <Scale size={22} className="text-indigo-400" />;
      case 'economy': return <PieChart size={22} className="text-blue-400" />;
      case 'mission': return <Globe size={22} className="text-cyan-400" />;
      case 'word_sharing': return <BookOpen size={22} className="text-amber-400" />;
      default: return <Plus size={22} className="text-slate-500" />;
    }
  };

  const resolvePrompt = (promptText) => {
    const normalized = promptText.toLowerCase();
    const matched = plugins.find(p => p.keywords?.some(keyword => normalized.includes(keyword.toLowerCase())));

    if (!matched) {
      return { route: null };
    }
    return { route: matched.route };
  };

  const handleQuerySubmit = (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setResolving(true);
    setPipelineStep(1);

    const result = resolvePrompt(query);
    setMatchedResult(result);

    const steps = [
      { step: 2, delay: 400 },
      { step: 3, delay: 800 },
      { step: 4, delay: 1200 },
      { step: 5, delay: 1600 },
      { step: 6, delay: 2000 }
    ];

    steps.forEach(({ step, delay }) => {
      setTimeout(() => {
        setPipelineStep(step);
        if (step === 6) {
          setTimeout(() => {
            setResolving(false);
            if (result.route) {
              navigate(result.route);
            } else {
              setShowWorkspaceModal(true);
            }
          }, 400);
        }
      }, delay);
    });
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-10 select-none overflow-y-auto no-scrollbar font-sans relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex items-center justify-between w-full max-w-6xl mx-auto z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles size={16} className="text-white animate-pulse" />
          </div>
          <span className="text-sm font-black tracking-widest bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">BOOZA THINK</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-semibold bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
            {user?.name || '사용자'}님
          </span>
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors font-bold px-2 py-1"
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto my-auto py-10 z-10 flex flex-col items-center">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
            무엇을 분석해 드릴까요?
          </h1>
          <p className="text-[11px] md:text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            BOOZA THINK AI가 주식, 부동산, 경제, 선교 등 다양한 서비스의 데이터를 분석해 드립니다.
          </p>
        </div>

        <form onSubmit={handleQuerySubmit} className="w-full max-w-xl relative mb-6">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={resolving}
              placeholder="무엇이든 질문하세요..."
              className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl py-3.5 pl-5 pr-14 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-xl shadow-slate-950/50 backdrop-blur-md"
            />
            <button 
              type="submit" 
              disabled={resolving || !query.trim()}
              className="absolute right-2 p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-800 disabled:text-slate-500 active:scale-95 transition-all"
            >
              <Send size={14} />
            </button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-xl">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              disabled={resolving}
              onClick={() => { setQuery(s); }}
              className="text-[10px] bg-slate-900/40 border border-slate-800/60 hover:border-indigo-500/50 hover:bg-slate-900 text-slate-400 hover:text-white px-3 py-1.5 rounded-xl transition-all active:scale-95"
            >
              🚀 {s}
            </button>
          ))}
        </div>

        <div className="w-full space-y-4">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest text-left pl-1">
            BOOZA THINK SERVICES
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
            {plugins.map((plugin) => (
              <div 
                key={plugin.id} 
                onClick={() => navigate(plugin.route)}
                className="p-4 rounded-2xl border border-indigo-500/20 bg-slate-900/40 hover:border-indigo-500/50 hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between h-36 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10">
                      {getPluginIcon(plugin.id)}
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">{plugin.name}</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                    {plugin.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full text-center text-[9px] text-slate-600 font-bold tracking-widest max-w-6xl mx-auto z-10 shrink-0">
        DECISION OS · POWERED BY BOOZA THINK
      </div>

      {resolving && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="glass max-w-sm w-full p-6 rounded-2xl border border-slate-800/80 shadow-2xl space-y-6">
            <div className="flex flex-col items-center gap-2 mb-2">
              <Cpu size={28} className="text-indigo-400 animate-spin" />
              <h3 className="text-sm font-extrabold text-white">AI Intent Router</h3>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900 text-center font-mono text-[9px] text-indigo-400">
              분석 중...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
