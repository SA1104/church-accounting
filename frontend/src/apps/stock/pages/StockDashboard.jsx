import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../App';
import { 
  TrendingUp, 
  Sparkles, 
  Search, 
  HelpCircle, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  ShieldAlert, 
  Play, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { getMockEvidenceForTicker, simulateOutcome } from '../../../core/research';

export default function StockDashboard() {
  const { token } = useAuth();
  const [ticker, setTicker] = useState('삼성전자');
  const [question, setQuestion] = useState('삼성전자 지금 추가 매수 해도 괜찮을까?');
  
  // Optional portfolio inputs
  const [holdingPrice, setHoldingPrice] = useState('');
  const [holdingQuantity, setHoldingQuantity] = useState('');
  const [investmentStyle, setInvestmentStyle] = useState('Growth');
  const [riskPreference, setRiskPreference] = useState('MEDIUM');

  // UI state
  const [resolving, setResolving] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'accuracy'

  // Research outputs
  const [currentResearch, setCurrentResearch] = useState(null);
  const [localHistory, setLocalHistory] = useState([]);
  
  // Validation simulation inputs
  const [simulatedPrice, setSimulatedPrice] = useState('');
  const [simulationCommitted, setSimulationCommitted] = useState(false);
  
  // Pre-filled questions per ticker
  const questionTemplates = {
    '삼성전자': '삼성전자 지금 추가 매수 해도 괜찮을까?',
    'SK하이닉스': 'SK하이닉스 목표주가가 적절한가?',
    '현대차': '현대차 매도 시점은 언제로 잡아야 하나?',
    '네이버': '네이버 장기투자 전망 괜찮을까?',
    '테슬라': '테슬라 최근 단기 변동성 리스크가 큰가?',
    '엔비디아': '엔비디아 지금 진입해도 무리 없을까?'
  };

  useEffect(() => {
    fetchPastResearches();
  }, [token]);

  const fetchPastResearches = async () => {
    try {
      const res = await fetch('/api/research', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLocalHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTickerChange = (val) => {
    setTicker(val);
    if (questionTemplates[val]) {
      setQuestion(questionTemplates[val]);
    }
  };

  const handleStartResearch = (e) => {
    if (e) e.preventDefault();
    if (!question.trim()) return;

    setResolving(true);
    setPipelineStep(1);
    setSimulationCommitted(false);

    // Simulate pipeline steps
    const steps = [
      { step: 2, delay: 500 },
      { step: 3, delay: 1100 },
      { step: 4, delay: 1700 },
      { step: 5, delay: 2300 },
      { step: 6, delay: 2900 },
      { step: 7, delay: 3500 }
    ];

    steps.forEach(({ step, delay }) => {
      setTimeout(() => {
        setPipelineStep(step);
        if (step === 7) {
          setTimeout(() => {
            finalizeResearch();
          }, 600);
        }
      }, delay);
    });
  };

  const finalizeResearch = async () => {
    // Generate simulated target prices
    const basePrices = {
      '삼성전자': { current: 71200, target: 82000, stop: 64000 },
      'SK하이닉스': { current: 154000, target: 185000, stop: 135000 },
      '현대차': { current: 202000, target: 240000, stop: 180000 },
      '네이버': { current: 182000, target: 215000, stop: 165000 },
      '테슬라': { current: 175, target: 210, stop: 150 },
      '엔비디아': { current: 115, target: 142, stop: 98 }
    };

    const priceInfo = basePrices[ticker] || { current: 10000, target: 12000, stop: 8500 };
    setSimulatedPrice(priceInfo.target); // Default simulation price is the target price

    const generatedEvidence = getMockEvidenceForTicker(ticker);
    const mockHypothesis = `분석 결과 ${ticker}는 단기적인 주가 반등 지지선 영역에 근접하여 매입 추천 의견을 도출합니다.`;

    const decision = {
      decisionType: 'StockBuyHoldSell',
      title: `${ticker} 투자 의사결정`,
      recommendation: 'BUY (분할 매수 권장)',
      confidence: 0.75 + Math.random() * 0.15,
      riskLevel: riskPreference,
      targetPrice: priceInfo.target,
      stopLoss: priceInfo.stop,
      expectedPeriod: '3 Months',
      status: 'Generated'
    };

    const newResearch = {
      question,
      ticker,
      market: ['테슬라', '엔비디아'].includes(ticker) ? 'NASDAQ' : 'KOSPI',
      portfolio: { holdingPrice: Number(holdingPrice) || 0, holdingQuantity: Number(holdingQuantity) || 0 },
      investmentStyle,
      hypothesis: mockHypothesis,
      evidence: generatedEvidence,
      analysis: `${ticker}의 분기 이익률 추이 및 거래량 변동 수급 지표에 근거할 때, 역사적 밸류에이션 하단 지지력이 확보된 것으로 판단됩니다.`,
      decision,
      validation: {
        trackedDays: 30,
        targetReached: false,
        stopLossTriggered: false,
        actualPrice30d: null,
        accuracyEvaluated: false
      },
      outcome: null,
      learning: null
    };

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newResearch)
      });
      if (res.ok) {
        const saved = await res.json();
        setCurrentResearch(saved);
        fetchPastResearches();
      }
    } catch (err) {
      console.error('Error saving research:', err);
    } finally {
      setResolving(false);
      setActiveTab('accuracy');
    }
  };

  const handleCommitSimulation = async () => {
    if (!currentResearch) return;
    setSimulationCommitted(true);

    const price = Number(simulatedPrice);
    const outcomeData = simulateOutcome(currentResearch.decision, price);
    const isTargetHit = price >= currentResearch.decision.targetPrice;
    const isStopHit = price <= currentResearch.decision.stopLoss;

    // Update in-memory local state
    const updatedResearch = {
      ...currentResearch,
      validation: {
        ...currentResearch.validation,
        targetReached: isTargetHit,
        stopLossTriggered: isStopHit,
        actualPrice30d: price,
        accuracyEvaluated: true
      },
      outcome: outcomeData,
      learning: isTargetHit 
        ? '목표 가격에 정상 도달하여 예측 성공. AI 모델 정확도를 상향 조정합니다.' 
        : '목표 미달 혹은 오차 발생. 거시 변수 변동성을 학습 모델에 반영합니다.'
    };

    setCurrentResearch(updatedResearch);

    // Commit a real Decision to backend Decision Store via POST /api/decisions so it updates the global timeline!
    try {
      await fetch('/api/decisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workspaceId: 'ws-invest',
          workspaceName: '내 투자계정',
          capabilityId: 'stock',
          capabilityName: 'Stock Think',
          decisionType: 'AssetAllocation',
          title: `${currentResearch.ticker} ${isTargetHit ? '예측 성공 매수' : '보유'} 결정`,
          description: `AI 추천 목표가 ${currentResearch.decision.targetPrice}원 대비 가상 가격 ${price}원 검증 완료.`,
          recommendation: currentResearch.decision.recommendation,
          confidence: currentResearch.decision.confidence,
          riskLevel: currentResearch.decision.riskLevel,
          status: 'Learned',
          learningScore: isTargetHit ? 95 : 60
        })
      });
      fetchPastResearches();
    } catch (err) {
      console.error('Error committing decision:', err);
    }
  };

  // KPI Calculations
  const calculateKpi = () => {
    const executed = localHistory.filter(r => r.outcome);
    if (executed.length === 0) {
      return { accuracy: 82.5, successRate: 75, avgReturn: 13.6, mdd: -8.2 };
    }
    const successCount = executed.filter(r => r.outcome.success).length;
    const returns = executed.map(r => r.outcome.returnRate);
    const successRate = Math.round((successCount / executed.length) * 100);
    const avgReturn = parseFloat((returns.reduce((a, b) => a + b, 0) / returns.length).toFixed(1));
    const mdd = Math.min(...returns, 0) < 0 ? Math.min(...returns, 0) : -5.0;

    return {
      accuracy: 80 + (successRate / 10),
      successRate,
      avgReturn,
      mdd
    };
  };

  const kpi = calculateKpi();

  return (
    <div className="p-4 space-y-4 font-sans select-none pb-12">
      
      {/* Platform Freezed Core Banner */}
      <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[9px] font-bold leading-normal flex items-start gap-2">
        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
        <div>
          <span>본 분석은 Stock Think 구조 검증을 위한 Mock Research 결과입니다. 실제 투자 판단 및 거래 대안으로 사용하지 마십시오.</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" />
            Stock Think
          </h1>
          <p className="text-[9px] text-slate-500 mt-0.5">AI-Powered Investment Research Platform</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[9px] font-bold">
          <button 
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1 rounded transition-all ${activeTab === 'workspace' ? 'bg-indigo-600 text-white font-extrabold' : 'text-slate-400 hover:text-white'}`}
          >
            Research Workspace
          </button>
          <button 
            onClick={() => setActiveTab('accuracy')}
            className={`px-3 py-1 rounded transition-all ${activeTab === 'accuracy' ? 'bg-indigo-600 text-white font-extrabold' : 'text-slate-400 hover:text-white'}`}
          >
            Accuracy Board
          </button>
        </div>
      </div>

      {activeTab === 'workspace' ? (
        <div className="space-y-4">
          {/* Main Input Panel */}
          <form onSubmit={handleStartResearch} className="glass p-5 rounded-2xl border border-slate-900 bg-slate-950/20 space-y-4">
            <div className="flex items-center gap-1.5 text-slate-400 pb-2 border-b border-slate-900/60">
              <HelpCircle size={13} />
              <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-200">무엇을 분석하시겠습니까?</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Ticker select */}
              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-slate-500 block">종목 선택</label>
                <select
                  value={ticker}
                  onChange={(e) => handleTickerChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="삼성전자">삼성전자 (KOSPI)</option>
                  <option value="SK하이닉스">SK하이닉스 (KOSPI)</option>
                  <option value="현대차">현대차 (KOSPI)</option>
                  <option value="네이버">네이버 (KOSPI)</option>
                  <option value="테슬라">테슬라 (NASDAQ)</option>
                  <option value="엔비디아">엔비디아 (NASDAQ)</option>
                </select>
              </div>

              {/* Question templates */}
              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-slate-500 block">분석 질문</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="예: 삼성전자 지금 매수해도 될까?"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Optional inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] font-bold pt-2 border-t border-slate-900/40">
              <div>
                <label className="text-slate-500 block mb-1">평균 매수가 (선택)</label>
                <input 
                  type="number" 
                  value={holdingPrice}
                  onChange={(e) => setHoldingPrice(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 focus:outline-none text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">보유 수량 (선택)</label>
                <input 
                  type="number" 
                  value={holdingQuantity}
                  onChange={(e) => setHoldingQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 focus:outline-none text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">투자 기간</label>
                <select
                  value={investmentStyle}
                  onChange={(e) => setInvestmentStyle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 focus:outline-none text-slate-300"
                >
                  <option value="Trading">Short-term Trading</option>
                  <option value="Growth">Mid-term Growth</option>
                  <option value="Dividend">Long-term Value</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 block mb-1">위험 선호도</label>
                <select
                  value={riskPreference}
                  onChange={(e) => setRiskPreference(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 focus:outline-none text-slate-300"
                >
                  <option value="LOW">보수적 투자</option>
                  <option value="MEDIUM">중립형 투자</option>
                  <option value="HIGH">공격적 투자</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={resolving || !question.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1"
            >
              <Play size={12} fill="currentColor" />
              <span>투자 분석 개시 (Start Research)</span>
            </button>
          </form>

          {/* History / Recent Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 최근 분석 */}
            <div className="glass p-4 rounded-2xl border border-slate-900 space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">최근 분석 이력</h3>
              {localHistory.length === 0 ? (
                <p className="text-[9.5px] text-slate-500 py-6 text-center">최근 분석 내역이 없습니다.</p>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto no-scrollbar">
                  {localHistory.slice(0, 4).map(res => (
                    <div 
                      key={res.id}
                      onClick={() => { setCurrentResearch(res); setActiveTab('accuracy'); }}
                      className="p-2.5 bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/20 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase">
                          {res.ticker}
                        </span>
                        <p className="text-[10px] font-semibold text-slate-200 truncate max-w-[210px]">{res.question}</p>
                      </div>
                      <ArrowRight size={10} className="text-slate-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 최근 의사결정 */}
            <div className="glass p-4 rounded-2xl border border-slate-900 space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">최근 AI 투자 의사결정</h3>
              {localHistory.length === 0 ? (
                <p className="text-[9.5px] text-slate-500 py-6 text-center">생성된 투자 결정이 없습니다.</p>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto no-scrollbar">
                  {localHistory.filter(r => r.decision).slice(0, 4).map(res => (
                    <div 
                      key={res.id}
                      className="p-2.5 bg-indigo-950/10 border border-indigo-900/10 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-[9.5px] font-bold text-slate-200">{res.ticker} 보유 추천</h4>
                        <span className="text-[8px] text-slate-500 font-semibold">신뢰도: {Math.round(res.decision.confidence * 100)}%</span>
                      </div>
                      <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase">
                        {res.decision.recommendation.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Accuracy Dashboard & Current Results */
        <div className="space-y-4">
          
          {/* Accuracy KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="glass p-3 rounded-2xl border border-slate-900 bg-slate-900/20">
              <span className="text-[8.5px] text-slate-500 block mb-0.5">AI 예측 정확도</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">{kpi.accuracy.toFixed(1)}%</span>
            </div>
            <div className="glass p-3 rounded-2xl border border-slate-900 bg-slate-900/20">
              <span className="text-[8.5px] text-slate-500 block mb-0.5">예측 성공률</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">{kpi.successRate}%</span>
            </div>
            <div className="glass p-3 rounded-2xl border border-slate-900 bg-slate-900/20">
              <span className="text-[8.5px] text-slate-500 block mb-0.5">평균 수익률</span>
              <span className="text-sm font-extrabold text-white font-mono">+{kpi.avgReturn}%</span>
            </div>
            <div className="glass p-3 rounded-2xl border border-slate-900 bg-slate-900/20">
              <span className="text-[8.5px] text-slate-500 block mb-0.5">최대 낙폭(MDD)</span>
              <span className="text-sm font-extrabold text-rose-400 font-mono">{kpi.mdd}%</span>
            </div>
          </div>

          {currentResearch ? (
            <div className="glass p-5 rounded-2xl border border-indigo-500/10 space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-900 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase">
                    {currentResearch.ticker} • {currentResearch.market}
                  </span>
                  <h2 className="text-xs font-bold text-white leading-normal">{currentResearch.question}</h2>
                </div>
                <span className="text-[8.5px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/20 font-bold uppercase shrink-0">
                  Research Object
                </span>
              </div>

              {/* Evidence Board (우선 수집 근거) */}
              <div className="space-y-2">
                <h3 className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">1. Evidence Board (구조화 수집 근거)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9.5px]">
                  {currentResearch.evidence.map((ev, idx) => (
                    <div key={idx} className="p-2 bg-slate-900/40 border border-slate-800/80 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">{ev.category}</span>
                        <span className="text-slate-300 font-semibold">{ev.title}</span>
                      </div>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        ev.status === 'Positive' ? 'text-emerald-400 bg-emerald-500/10' :
                        ev.status === 'Negative' ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 bg-slate-800'
                      }`}>
                        {ev.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Opinion & Hypothesis */}
              <div className="space-y-1.5 p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/80 text-[10px] leading-relaxed">
                <h4 className="font-extrabold text-slate-200">2. AI 가설 및 분석 의견</h4>
                <p className="text-slate-400">{currentResearch.hypothesis}</p>
                <p className="text-slate-400">{currentResearch.analysis}</p>
              </div>

              {/* Decision Card */}
              {currentResearch.decision && (
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/15 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-indigo-900/30">
                    <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-wider">3. AI Investment Decision</span>
                    <span className="text-[8px] text-slate-500 font-mono">ID: {currentResearch.decision.id}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="p-1.5 bg-slate-950/30 rounded-lg">
                      <span className="text-[8px] text-slate-500 block">AI 의견</span>
                      <span className="font-extrabold text-emerald-400">{currentResearch.decision.recommendation}</span>
                    </div>
                    <div className="p-1.5 bg-slate-950/30 rounded-lg">
                      <span className="text-[8px] text-slate-500 block">목표가</span>
                      <span className="font-bold text-white">{currentResearch.decision.targetPrice.toLocaleString()}원</span>
                    </div>
                    <div className="p-1.5 bg-slate-950/30 rounded-lg">
                      <span className="text-[8px] text-slate-500 block">손절가</span>
                      <span className="font-bold text-rose-400">{currentResearch.decision.stopLoss.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Queue & Outcome Simulator */}
              <div className="p-4.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-950">
                  <h4 className="text-[9.5px] font-extrabold text-emerald-400 uppercase tracking-wider">4. Validation & Outcome Simulator</h4>
                  <span className="text-[8.5px] text-slate-500 font-semibold">30일 후 예측 가격 검증 시뮬레이션</span>
                </div>

                {!currentResearch.outcome ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 block">30일 후 종가(Closing Price) 입력</label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          value={simulatedPrice}
                          onChange={(e) => setSimulatedPrice(e.target.value)}
                          placeholder="시뮬레이션 가격 입력..."
                          className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          onClick={handleCommitSimulation}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition-all"
                        >
                          가격 검증 수행
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div className="p-2 bg-slate-950/40 rounded-lg">
                        <span className="text-[8px] text-slate-500 block">실제 검증가</span>
                        <span className="font-bold text-white font-mono">{currentResearch.validation.actualPrice30d.toLocaleString()}원</span>
                      </div>
                      <div className="p-2 bg-slate-950/40 rounded-lg">
                        <span className="text-[8px] text-slate-500 block">투자 수익률 (Outcome)</span>
                        <span className={`font-mono font-extrabold ${currentResearch.outcome.returnRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {currentResearch.outcome.returnRate >= 0 ? '+' : ''}{currentResearch.outcome.returnRate}%
                        </span>
                      </div>
                    </div>
                    <div className="p-2 bg-emerald-950/15 border border-emerald-900/20 text-[9.5px] rounded-lg text-emerald-300 font-semibold">
                      <strong>AI 피드백 학습의견:</strong> {currentResearch.learning}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-slate-500 py-12 text-center">Research Workspace 탭으로 이동하여 분석을 먼저 수행해주세요.</p>
          )}
        </div>
      )}

      {/* Pipeline resolving overlay modal */}
      {resolving && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="glass max-w-sm w-full p-6 rounded-2xl border border-slate-800/80 shadow-2xl space-y-4">
            <div className="flex flex-col items-center gap-2 mb-2">
              <Cpu size={28} className="text-indigo-400 animate-spin" />
              <h3 className="text-sm font-extrabold text-white">Stock Research Pipeline</h3>
              <p className="text-[10px] text-slate-400 text-center font-mono">"{ticker} 분석 시뮬레이션 개시"</p>
            </div>

            <div className="space-y-3 font-mono text-[10px] pl-2">
              <div className="flex items-center gap-2">
                {pipelineStep >= 1 ? <CheckCircle2 size={12} className="text-emerald-400" /> : <div className="w-3 h-3 rounded-full border border-slate-700"></div>}
                <span className={pipelineStep >= 1 ? "text-emerald-400 animate-pulse" : "text-slate-500"}>1. Question Received</span>
              </div>
              <div className="flex items-center gap-2">
                {pipelineStep >= 2 ? <CheckCircle2 size={12} className="text-emerald-400" /> : <div className="w-3 h-3 rounded-full border border-slate-700"></div>}
                <span className={pipelineStep >= 2 ? "text-emerald-400" : "text-slate-500"}>2. Hypothesis Formulation</span>
              </div>
              <div className="flex items-center gap-2">
                {pipelineStep >= 3 ? <CheckCircle2 size={12} className="text-emerald-400" /> : <div className="w-3 h-3 rounded-full border border-slate-700"></div>}
                <span className={pipelineStep >= 3 ? "text-emerald-400" : "text-slate-500"}>3. Evidence Collection</span>
              </div>
              <div className="flex items-center gap-2">
                {pipelineStep >= 4 ? <CheckCircle2 size={12} className="text-emerald-400" /> : <div className="w-3 h-3 rounded-full border border-slate-700"></div>}
                <span className={pipelineStep >= 4 ? "text-emerald-400" : "text-slate-500"}>4. AI Valuation Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                {pipelineStep >= 5 ? <CheckCircle2 size={12} className="text-emerald-400" /> : <div className="w-3 h-3 rounded-full border border-slate-700"></div>}
                <span className={pipelineStep >= 5 ? "text-emerald-400" : "text-slate-500"}>5. Decision Generation</span>
              </div>
              <div className="flex items-center gap-2">
                {pipelineStep >= 6 ? <CheckCircle2 size={12} className="text-emerald-400 animate-pulse" /> : <div className="w-3 h-3 rounded-full border border-slate-700"></div>}
                <span className={pipelineStep >= 6 ? "text-emerald-400 font-bold" : "text-slate-500"}>6. Validation Queue Configured</span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900 text-center font-mono text-[9px] text-indigo-400">
              {pipelineStep === 6 ? '의사결정 노드 전이 완료...' : 'KOSPI/NASDAQ 밸류에이션 데이터 동조화 중...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
