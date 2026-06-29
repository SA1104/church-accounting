import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { plugins } from '../core/plugins';
import { 
  Sparkles, 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  MapPin, 
  Sliders, 
  Monitor, 
  Clock, 
  AlertTriangle,
  Building2,
  TrendingUp,
  Home,
  Globe,
  Plus
} from 'lucide-react';

export default function Portal() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  const [query, setQuery] = useState('');
  const [resolving, setResolving] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [matchedResult, setMatchedResult] = useState(null);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const suggestions = [
    "삼성전자 분석해줘",
    "이번 달 교회 예산 보여줘",
    "목동 재건축 추천해줘",
    "인도 선교 환율 알려줘"
  ];

  // Helper icons for dynamic plugin rendering
  const getPluginIcon = (id) => {
    switch (id) {
      case 'church': return <Building2 size={22} className="text-indigo-400 animate-pulse" />;
      case 'stock': return <TrendingUp size={22} className="text-emerald-400" />;
      case 'estate': return <Home size={22} className="text-violet-400" />;
      case 'mission': return <Globe size={22} className="text-cyan-400" />;
      default: return <Plus size={22} className="text-slate-500" />;
    }
  };

  // Mock Intent Router
  const resolvePrompt = (promptText) => {
    const normalized = promptText.toLowerCase();

    // Check against keywords in plugins registry
    const matched = plugins.find(p => 
      p.keywords?.some(keyword => normalized.includes(keyword.toLowerCase()))
    );

    if (!matched) {
      return {
        intent: 'generic',
        workspace: null,
        capability: null,
        route: null,
        confidence: 0
      };
    }

    return {
      intent: `evaluate_${matched.id}`,
      workspace: matched.defaultWorkspace,
      capability: matched.id,
      route: matched.route,
      confidence: 0.88
    };
  };

  const handleQuerySubmit = (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setResolving(true);
    setPipelineStep(1);
    setErrorMsg('');

    const result = resolvePrompt(query);
    setMatchedResult(result);

    // Dynamic pipeline step delay simulations for ultra premium feel
    const steps = [
      { step: 2, delay: 600 },
      { step: 3, delay: 1200 },
      { step: 4, delay: 1800 },
      { step: 5, delay: 2400 },
      { step: 6, delay: 3000 }
    ];

    steps.forEach(({ step, delay }) => {
      setTimeout(() => {
        setPipelineStep(step);
        if (step === 6) {
          // Final decision routing
          setTimeout(() => {
            setResolving(false);
            if (result.route) {
              navigate(result.route);
            } else {
              setShowWorkspaceModal(true);
            }
          }, 600);
        }
      }, delay);
    });
  };

  const handleSelectWorkspace = (plugin) => {
    setShowWorkspaceModal(false);
    navigate(plugin.route);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-10 select-none overflow-y-auto no-scrollbar font-sans relative">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles size={16} className="text-white animate-pulse" />
          </div>
          <span className="text-sm font-black tracking-widest bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">BOOZA THINK</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-semibold bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
            {user?.name}님 ({user?.position || '사용자'})
          </span>
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors font-bold px-2 py-1"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-3xl mx-auto my-auto py-10 z-10 flex flex-col items-center">
        {/* Title Section */}
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
            오늘 무엇을 도와드릴까요?
          </h1>
          <p className="text-[11px] md:text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            질문을 던져보세요. BOOZA THINK AI가 가장 적합한 Capability와 Workspace를 찾아 의사결정을 지원합니다.
          </p>
        </div>

        {/* Input Form */}
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

        {/* Suggestion Pills */}
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

        {/* Capability Cards Section */}
        <div className="w-full space-y-4">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest text-left pl-1">
            Registered Capabilities (Plugins)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {plugins.map((plugin) => (
              <div 
                key={plugin.id} 
                className={`p-4.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-40 ${
                  plugin.status === 'active' 
                    ? 'border-indigo-500/20 bg-slate-900/40 hover:border-indigo-500/50 hover:shadow-indigo-500/5' 
                    : plugin.status === 'coming-soon'
                      ? 'border-slate-800/80 bg-slate-900/10 opacity-70'
                      : 'border-slate-900 bg-slate-950/20 opacity-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${
                      plugin.status === 'active' ? 'bg-indigo-500/10' : 'bg-slate-800/30'
                    }`}>
                      {getPluginIcon(plugin.id)}
                    </div>
                    {plugin.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
                        {plugin.defaultWorkspace}
                      </span>
                    ) : plugin.status === 'coming-soon' ? (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-semibold bg-slate-800/50 text-slate-400 border border-slate-700/50">
                        Coming Soon
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-semibold bg-slate-900/50 text-slate-500 border border-slate-900">
                        Stub
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">{plugin.name}</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {plugin.description}
                  </p>
                </div>

                {plugin.status === 'active' ? (
                  <button
                    onClick={() => navigate(plugin.route)}
                    className="w-full mt-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold py-1.5 rounded-xl text-[10px] transition-all flex items-center justify-center gap-1 border border-indigo-500/20"
                  >
                    Workspace 진입하기 <ArrowRight size={10} />
                  </button>
                ) : (
                  <div className="w-full text-center text-[9px] text-slate-600 py-1.5 border border-dashed border-slate-800/60 rounded-xl mt-3 select-none">
                    비활성화 상태
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full text-center text-[9px] text-slate-600 font-bold tracking-widest max-w-6xl mx-auto z-10 shrink-0">
        DECISION OS · POWERED BY BOOZA THINK
      </div>

      {/* AI Intent Router Pipeline Overlay */}
      {resolving && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="glass max-w-sm w-full p-6 rounded-2xl border border-slate-800/80 shadow-2xl space-y-6">
            <div className="flex flex-col items-center gap-2 mb-2">
              <Cpu size={28} className="text-indigo-400 animate-spin" />
              <h3 className="text-sm font-extrabold text-white">AI Intent Router</h3>
              <p className="text-[10px] text-slate-400 text-center font-mono">"{query}"</p>
            </div>

            <div className="space-y-3 font-mono text-[10px] pl-2">
              <div className="flex items-center gap-2">
                {pipelineStep >= 1 ? <CheckCircle2 size={12} className="text-emerald-400" /> : <div className="w-3 h-3 rounded-full border border-slate-700"></div>}
                <span className={pipelineStep >= 1 ? "text-emerald-400" : "text-slate-500"}>1. Intent Classifier</span>
              </div>
              <div className="flex items-center gap-2">
                {pipelineStep >= 2 ? <CheckCircle2 size={12} className="text-emerald-400" /> : <div className="w-3 h-3 rounded-full border border-slate-700"></div>}
                <span className={pipelineStep >= 2 ? "text-emerald-400" : "text-slate-500"}>2. Workspace Resolver</span>
              </div>
              <div className="flex items-center gap-2">
                {pipelineStep >= 3 ? <CheckCircle2 size={12} className="text-emerald-400" /> : <div className="w-3 h-3 rounded-full border border-slate-700"></div>}
                <span className={pipelineStep >= 3 ? "text-emerald-400" : "text-slate-500"}>3. Capability Resolver</span>
              </div>
              <div className="flex items-center gap-2">
                {pipelineStep >= 4 ? <CheckCircle2 size={12} className="text-emerald-400" /> : <div className="w-3 h-3 rounded-full border border-slate-700"></div>}
                <span className={pipelineStep >= 4 ? "text-emerald-400" : "text-slate-500"}>4. Tool Resolver</span>
              </div>
              <div className="flex items-center gap-2">
                {pipelineStep >= 5 ? <CheckCircle2 size={12} className="text-emerald-400" /> : <div className="w-3 h-3 rounded-full border border-slate-700"></div>}
                <span className={pipelineStep >= 5 ? "text-emerald-400" : "text-slate-500"}>5. Screen Resolver</span>
              </div>
              <div className="flex items-center gap-2">
                {pipelineStep >= 6 ? <CheckCircle2 size={12} className="text-emerald-400 animate-pulse" /> : <div className="w-3 h-3 rounded-full border border-slate-700"></div>}
                <span className={pipelineStep >= 6 ? "text-emerald-400 font-bold" : "text-slate-500"}>6. Response Ready</span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900 text-center font-mono text-[9px] text-indigo-400">
              {pipelineStep === 6 ? '라우팅 결정을 실행합니다...' : '의사결정 노드 탐색 중...'}
            </div>
          </div>
        </div>
      )}

      {/* Fallback Workspace Select Modal */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="glass max-w-sm w-full p-6 rounded-2xl border border-slate-800/80 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <AlertTriangle size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Unresolved Intent</h3>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              질문이 특정 Workspace로 분류되지 않았습니다. 분석 작업을 처리할 대상 Workspace를 수동으로 지정해주세요.
            </p>
            <div className="space-y-2 pt-2">
              {plugins.filter(p => p.status === 'active' || p.status === 'coming-soon').map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectWorkspace(p)}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-xs font-bold text-slate-200 transition-all flex items-center justify-between"
                >
                  <span>{p.name} ({p.defaultWorkspace})</span>
                  <ArrowRight size={12} className="text-slate-500" />
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowWorkspaceModal(false); setQuery(''); }}
              className="w-full mt-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white py-2 rounded-xl text-[10px] font-bold transition-all border border-slate-800"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
