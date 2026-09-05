import React, { useState, useEffect, useRef } from 'react';
import ApprovalTrendChart from '../components/ApprovalTrendChart';
import CommentsPanel from '../components/CommentsPanel';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { apiClient } from '../../../core/api';

const normalizeScore = (value, max) => {
  if (!value) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
};

const PARTY_COLORS = {
  '더불어민주당': '#1D4ED8', // Blue-700
  '국민의힘': '#DC2626',   // Red-600
  '조국혁신당': '#0284C7', // Light Blue
  '개혁신당': '#EA580C',   // Orange
  '무소속': '#64748B'      // Slate
};

const getPartyColor = (partyName, isAlt = false) => {
  const baseColor = PARTY_COLORS[partyName] || PARTY_COLORS['무소속'];
  return baseColor;
};

// Custom Dropdown Component with Search
const SearchableSelect = ({ options, value, onChange, placeholder, outlineColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(search.toLowerCase()) || 
    (opt.party && opt.party.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedOpt = options.find(opt => opt.id === value);

  return (
    <div ref={wrapperRef} className="relative w-full mb-4 z-30">
      <div 
        className="w-full bg-slate-900 border text-white rounded-lg p-3 cursor-pointer flex justify-between items-center"
        style={{ borderColor: isOpen ? outlineColor : '#334155' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOpt ? selectedOpt.name : placeholder}</span>
        <span className="text-slate-400">▼</span>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
          <div className="p-2 border-b border-slate-700">
            <input
              type="text"
              className="w-full bg-slate-900 text-white rounded p-2 outline-none border border-slate-700 focus:border-slate-500"
              placeholder="이름 또는 정당 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id}
                  className="p-3 hover:bg-slate-700 cursor-pointer text-white flex justify-between items-center"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <span className="font-medium">{opt.name}</span>
                  <span className="text-xs text-slate-400">{opt.party || '무소속'}</span>
                </div>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-slate-500 text-sm">검색 결과가 없습니다.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function PoliticsAnalysisPage() {
  const [viewMode, setViewMode] = useState('party'); // 'politician' | 'party'
  const [politicians, setPoliticians] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPolA, setSelectedPolA] = useState('');
  const [selectedPolB, setSelectedPolB] = useState('');
  
  const [selectedPartyA, setSelectedPartyA] = useState('');
  const [selectedPartyB, setSelectedPartyB] = useState('');
  
  // Modal state
  const [modalData, setModalData] = useState(null); // { party, metricId, metricName }

  const handleEntityInteraction = async (id, type, interactionType) => {
    try {
      const storageKey = `politics_interaction_${type}_${id}`;
      const previousInteraction = localStorage.getItem(storageKey);
      
      let action = 'increment';
      if (previousInteraction === interactionType) {
        action = 'decrement';
        localStorage.removeItem(storageKey);
      } else {
        if (previousInteraction) {
           action = 'switch';
        }
        localStorage.setItem(storageKey, interactionType);
      }

      await apiClient(`/api/services/politics/${type}/${encodeURIComponent(id)}/interaction`, {
        method: 'POST',
        body: JSON.stringify({ type: interactionType, action, previousInteraction })
      });
      
      const updateFn = prev => prev.map(p => {
        const pId = type === 'party' ? p.name : p.id;
        if (pId === id) {
          const newState = { ...p };
          if (action === 'increment') {
            newState[interactionType + 's'] = (newState[interactionType + 's'] || 0) + 1;
          } else if (action === 'decrement') {
            newState[interactionType + 's'] = Math.max(0, (newState[interactionType + 's'] || 0) - 1);
          } else if (action === 'switch') {
             newState[interactionType + 's'] = (newState[interactionType + 's'] || 0) + 1;
             newState[previousInteraction + 's'] = Math.max(0, (newState[previousInteraction + 's'] || 0) - 1);
          }
          return newState;
        }
        return p;
      });
      
      if (type === 'politician') setPoliticians(updateFn);
      else if (type === 'party') setParties(updateFn);

    } catch (e) {
      console.error(e);
      alert('반영에 실패했습니다.');
    }
  };

  useEffect(() => {
    const fetchPoliticians = async () => {
      try {
        const data = await apiClient('/api/services/politics/politicians');
        setPoliticians(data);
        if (data.length >= 2) {
          setSelectedPolA(data[0].id);
          setSelectedPolB(data[1].id);
        }
        
        // Extract unique parties
        const partyMap = new Map();
        data.forEach(p => {
          if (!p.party) return;
          if (!partyMap.has(p.party)) {
            partyMap.set(p.party, { id: p.party, name: p.party, members: [] });
          }
          partyMap.get(p.party).members.push(p);
        });
        
        
        const partyData = await apiClient('/api/services/politics/parties');
        const partyStats = (partyData?.data || []).reduce((acc, p) => ({...acc, [p.name]: p}), {});
        const partyArray = Array.from(partyMap.values()).map(p => ({
          ...p, 
          likes: partyStats[p.name]?.likes || 0,
          dislikes: partyStats[p.name]?.dislikes || 0
        }));
  
        setParties(partyArray);
        
        const minjoo = partyArray.find(p => p.name === '더불어민주당');
        const ppp = partyArray.find(p => p.name === '국민의힘');
        
        if (minjoo && ppp) {
          setSelectedPartyA(minjoo.id);
          setSelectedPartyB(ppp.id);
        } else if (partyArray.length >= 2) {
          setSelectedPartyA(partyArray[0].id);
          setSelectedPartyB(partyArray[1].id);
        } else if (partyArray.length === 1) {
          setSelectedPartyA(partyArray[0].id);
          setSelectedPartyB(partyArray[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch politicians:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPoliticians();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">데이터를 불러오는 중입니다...</div>;
  }

  const polA = politicians.find(p => p.id === selectedPolA);
  const polB = politicians.find(p => p.id === selectedPolB);

  const getPolChartData = (pA, pB) => {
    return [
      { subject: '도덕성/청렴', A: pA?.stats?.pledge || pA?.dynamic_metrics?.morality_index || 70, B: pB?.stats?.pledge || pB?.dynamic_metrics?.morality_index || 70, id: 'morality_index', fullMark: 100 },
      { subject: '대권잠재력', A: pA?.stats?.approval || 50, B: pB?.stats?.approval || 50, id: 'approval', fullMark: 100 },
      { subject: '세대별 소구력', A: pA?.dynamic_metrics?.voter_expansion || 60, B: pB?.dynamic_metrics?.voter_expansion || 60, id: 'voter_expansion', fullMark: 100 },
      { subject: '입법/행정', A: pA?.stats?.attendance || 85, B: pB?.stats?.attendance || 85, id: 'attendance', fullMark: 100 },
      { subject: '화제성(SNS)', A: pA?.stats?.buzz || pA?.dynamic_metrics?.sns_power || 50, B: pB?.stats?.buzz || pB?.dynamic_metrics?.sns_power || 50, id: 'sns_power', fullMark: 100 },
    ];
  };

  const getPartyChartData = (pA, pB) => {
    const calcAvg = (party, keyPath) => {
      if (!party || !party.members || party.members.length === 0) return 50;
      let sum = 0;
      let count = 0;
      party.members.forEach(m => {
        let val;
        if (keyPath === 'approval') val = m.stats?.approval;
        else if (keyPath === 'attendance') val = m.stats?.attendance;
        else if (keyPath === 'sns_power') val = m.stats?.buzz || m.dynamic_metrics?.sns_power;
        else if (keyPath === 'morality_index') val = m.stats?.pledge || m.dynamic_metrics?.morality_index;
        else val = m.dynamic_metrics?.[keyPath];
        if (val !== undefined && val !== null) {
          sum += val;
          count++;
        }
      });
      return count === 0 ? 50 : Math.round(sum / count);
    };

    return [
      { subject: '도덕성/청렴', A: calcAvg(pA, 'morality_index'), B: calcAvg(pB, 'morality_index'), id: 'morality_index', fullMark: 100 },
      { subject: '대권잠재력', A: calcAvg(pA, 'approval'), B: calcAvg(pB, 'approval'), id: 'approval', fullMark: 100 },
      { subject: '세대별 소구력', A: calcAvg(pA, 'voter_expansion'), B: calcAvg(pB, 'voter_expansion'), id: 'voter_expansion', fullMark: 100 },
      { subject: '입법/행정', A: calcAvg(pA, 'attendance'), B: calcAvg(pB, 'attendance'), id: 'attendance', fullMark: 100 },
      { subject: '화제성(SNS)', A: calcAvg(pA, 'sns_power'), B: calcAvg(pB, 'sns_power'), id: 'sns_power', fullMark: 100 },
    ];
  };

  const partyA = parties.find(p => p.id === selectedPartyA);
  const partyB = parties.find(p => p.id === selectedPartyB);

  const chartData = viewMode === 'politician' ? getPolChartData(polA, polB) : getPartyChartData(partyA, partyB);

  const colorA = viewMode === 'politician' ? getPartyColor(polA?.party) : getPartyColor(partyA?.name);
  const colorB = viewMode === 'politician' ? getPartyColor(polB?.party, true) : getPartyColor(partyB?.name, true);
  
  const isSameParty = (viewMode === 'politician' && polA?.party === polB?.party) || (viewMode === 'party' && partyA?.name === partyB?.name);

  // Click handler for Radar Axis
  const handleAxisClick = (payload) => {
    if (viewMode !== 'party') return;
    const metricName = payload.value;
    const metricItem = chartData.find(d => d.subject === metricName);
    if (!metricItem) return;
    
    // We can show modal for the currently selected parties
    setModalData({
      metricId: metricItem.id,
      metricName: metricItem.subject,
      parties: [partyA, partyB].filter(Boolean)
    });
  };

  // Render modal content
  const renderModal = () => {
    if (!modalData) return null;
    
    const getTopBottom = (party) => {
      if (!party || !party.members) return { top: [], bottom: [] };
      const sorted = [...party.members].sort((a, b) => {
        const valA = modalData.metricId === 'approval' ? (a.stats?.approval || 0) : modalData.metricId === 'attendance' ? (a.stats?.attendance || 0) : (a.dynamic_metrics?.[modalData.metricId] || 0);
        const valB = modalData.metricId === 'approval' ? (b.stats?.approval || 0) : modalData.metricId === 'attendance' ? (b.stats?.attendance || 0) : (b.dynamic_metrics?.[modalData.metricId] || 0);
        return valB - valA;
      });
      
      return {
        top: sorted.slice(0, 5),
        bottom: sorted.slice(-5).reverse() // reverse so lowest is first
      };
    };
    
    const getMetricLogic = (metricId) => {
      switch(metricId) {
        case 'ethics': return '최근 5년간 선거관리위원회 전과기록, 국회 윤리특위 회부 횟수, 그리고 시민단체 낙천낙선 리스트 등재 여부를 종합하여 기본 100점에서 감점하는 방식으로 산출됩니다.';
        case 'potential': return '네이버/구글 검색 트렌드의 \'대권\', \'후보\' 연관 검색어 비율과 주요 여론조사기관의 차기 정치지도자 선호도 조사 결과를 가중 평균하여 산출됩니다.';
        case 'generation': return '소셜 미디어(인스타그램, 틱톡 등) 2030 세대 언급량과 유튜브 주요 정치 채널의 댓글 작성자 연령대 데이터를 분석하여 산출됩니다.';
        case 'attendance': return '국회 본회의 출석률 및 상임위원회 출석률을 5:5 비율로 합산하여 100점 만점으로 환산한 수치입니다.';
        case 'buzz': return '최근 6개월간 네이버 데이터랩(DataLab)의 인물 검색량 추이를 기반으로, 가장 검색량이 높았던 시점을 100으로 환산한 상대적 화제성 지수입니다.';
        case 'approval': return '최근 6개월간 발표된 주요 4개 여론조사 기관(갤럽, 리얼미터 등)의 긍정 평가 비율을 평균 내어 산출한 수치입니다.';
        default: return '내부 데이터 파이프라인의 복합적인 AI 분석 알고리즘에 의해 산출된 점수입니다.';
      }
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setModalData(null)}>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">📊 {modalData.metricName} 기여도 및 산출 로직</h3>
            <button onClick={() => setModalData(null)} className="text-slate-400 hover:text-white text-xl">&times;</button>
          </div>
          
          <div className="bg-slate-800/80 rounded-lg p-4 mb-6 border border-slate-700">
            <h4 className="text-sm font-bold text-indigo-400 mb-2">💡 점수 산출 로직 (검증팀)</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              해당 지표({modalData.metricName})는 다음과 같은 데이터와 로직에 의해 투명하게 계산됩니다:<br/>
              <span className="text-white font-medium mt-1 inline-block">{getMetricLogic(modalData.metricId)}</span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modalData.parties.map((party, idx) => {
              const { top, bottom } = getTopBottom(party);
              const color = getPartyColor(party.name);
              const getValue = (m) => modalData.metricId === 'approval' ? (m.stats?.approval || 0) : modalData.metricId === 'attendance' ? (m.stats?.attendance || 0) : (m.dynamic_metrics?.[modalData.metricId] || 0);
              
              return (
                <div key={party.name} className="space-y-4">
                  <div className="font-bold text-lg p-2 rounded text-center border-b-2" style={{ borderColor: color, color }}>
                    {party.name}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-bold text-blue-400 mb-2">🏆 상위 5명 (기여도 TOP)</h4>
                    <div className="space-y-2">
                      {top.map((m, i) => (
                        <div key={m.id} className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                          <span className="text-sm text-white"><span className="text-xs text-slate-500 mr-2">{i+1}</span>{m.name}</span>
                          <span className="text-sm font-bold text-blue-300">{getValue(m)}점</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <h4 className="text-sm font-bold text-red-400 mb-2">🚨 하위 5명 (훼손도 WORST)</h4>
                    <div className="space-y-2">
                      {bottom.map((m, i) => (
                        <div key={m.id} className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                          <span className="text-sm text-white"><span className="text-xs text-slate-500 mr-2">{i+1}</span>{m.name}</span>
                          <span className="text-sm font-bold text-red-300">{getValue(m)}점</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-slate-950 min-h-screen text-slate-200">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">⚖️</span> AI 정치 지형도
            </h1>
            <p className="text-sm text-slate-400 mt-2">부자생각 AI가 분석한 정치인 및 정당의 입체적 역량 평가</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto p-1 bg-slate-800/50 rounded-lg">
            <button 
              className={`px-4 py-2.5 md:py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${viewMode === 'politician' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setViewMode('politician')}
            >
              👤 인물 비교
            </button>
            <button 
              className={`px-4 py-2.5 md:py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${viewMode === 'party' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setViewMode('party')}
            >
              🏛️ 정당 비교
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-start">
            
            {/* PROFILE A */}
            <div className="flex flex-col p-4 bg-slate-800/50 rounded-xl border border-slate-700 h-full">
              {viewMode === 'politician' ? (
                <SearchableSelect options={politicians} value={selectedPolA} onChange={setSelectedPolA} placeholder="정치인 선택..." outlineColor={colorA} />
              ) : (
                <SearchableSelect options={parties} value={selectedPartyA} onChange={setSelectedPartyA} placeholder="정당 선택..." outlineColor={colorA} />
              )}
              
              {viewMode === 'politician' ? (
                polA ? (
                  <div className="flex flex-col items-center">
                    <img src={polA.imageUrl} alt={polA.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 mb-4 bg-white" style={{ borderColor: colorA }} />
                    <h3 className="text-xl font-bold text-white">
                      {polA.namuwikiUrl ? <a href={polA.namuwikiUrl} target="_blank" rel="noreferrer" className="hover:underline">{polA.name}</a> : polA.name}
                    </h3>
                    <div className="flex gap-2 mt-2 mb-4">
                      <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${colorA}33`, color: colorA }}>{polA.party || '무소속'}</span>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600">{polA.role_type === 'MAYOR' ? '지자체장' : polA.role_type === 'EXTRA_PARLIAMENTARY' ? '원외인사' : '국회의원'}</span>
                    </div>
                    <div className="flex gap-4 mb-4">
                      <button onClick={() => handleEntityInteraction(polA.id, 'politician', 'like')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👍 {polA.likes || 0}</button>
                      <button onClick={() => handleEntityInteraction(polA.id, 'politician', 'dislike')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👎 {polA.dislikes || 0}</button>
                    </div>
                    {/* Score list inside profile for politician */}
                    <div className="w-full bg-slate-900/50 rounded-lg p-3 space-y-2 text-sm">
                      {chartData.map(d => (
                        <div key={d.subject} className="flex justify-between items-center border-b border-slate-700/50 pb-1 last:border-0 last:pb-0">
                          <span className="text-slate-400">{d.subject}</span>
                          <span className="font-bold text-white" style={{ color: colorA }}>{d.A}점</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500">선택된 인물이 없습니다.</div>
                )
              ) : (
                partyA ? (
                  <div className="flex flex-col items-center w-full">
                    <div className="w-24 h-24 rounded-full border-4 mb-3 flex items-center justify-center text-3xl font-black text-white" style={{ borderColor: colorA, backgroundColor: colorA }}>
                      {partyA.name.substring(0, 1)}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{partyA.name}</h3>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600 mb-2">소속 인물 {partyA.members.length}명</span>
                    <div className="flex gap-4 mb-4">
                      <button onClick={() => handleEntityInteraction(partyA.name, 'party', 'like')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👍 {partyA.likes || 0}</button>
                      <button onClick={() => handleEntityInteraction(partyA.name, 'party', 'dislike')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👎 {partyA.dislikes || 0}</button>
                    </div>
                    
                    <div className="w-full bg-slate-900/50 rounded-lg p-3 space-y-2 text-sm">
                      <div className="text-[10px] text-slate-500 text-center mb-2 animate-pulse">지표 클릭 시 기여도 상세 확인</div>
                      {chartData.map(d => (
                        <div key={d.subject} onClick={() => setModalData({ metricId: d.id, metricName: d.subject, parties: [partyA] })} className="flex justify-between items-center border-b border-slate-700/50 pb-1 last:border-0 last:pb-0 cursor-pointer hover:bg-slate-800 p-1 rounded transition-colors">
                          <span className="text-slate-300 hover:text-white">{d.subject}</span>
                          <span className="font-bold" style={{ color: colorA }}>{d.A}점</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500">선택된 정당이 없습니다.</div>
                )
              )}
            </div>

            {/* Radar Chart Middle */}
            <div className="flex flex-col w-full bg-slate-950/30 rounded-xl md:sticky md:top-6 border border-slate-800">
              <div className="h-[280px] md:h-[350px] w-full flex justify-center items-center pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="60%" data={chartData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#94a3b8', fontSize: 11, cursor: viewMode === 'party' ? 'pointer' : 'default' }}
                      onClick={handleAxisClick} 
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Radar name={viewMode === 'politician' ? (polA?.name || 'A') : (partyA?.name || 'Party A')} dataKey="A" stroke={colorA} fill="transparent" strokeWidth={2} />
                    <Radar name={viewMode === 'politician' ? (polB?.name || 'B') : (partyB?.name || 'Party B')} dataKey="B" stroke={colorB} fill="transparent" strokeWidth={2} strokeDasharray={isSameParty ? "5 5" : undefined} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PROFILE B */}
            <div className="flex flex-col p-4 bg-slate-800/50 rounded-xl border border-slate-700 h-full">
              {viewMode === 'politician' ? (
                <SearchableSelect options={politicians} value={selectedPolB} onChange={setSelectedPolB} placeholder="정치인 선택..." outlineColor={colorB} />
              ) : (
                <SearchableSelect options={parties} value={selectedPartyB} onChange={setSelectedPartyB} placeholder="정당 선택..." outlineColor={colorB} />
              )}
              
              {viewMode === 'politician' ? (
                polB ? (
                  <div className="flex flex-col items-center">
                    <img src={polB.imageUrl} alt={polB.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 mb-4 bg-white" style={{ borderColor: colorB, borderStyle: isSameParty ? 'dashed' : 'solid' }} />
                    <h3 className="text-xl font-bold text-white">
                      {polB.namuwikiUrl ? <a href={polB.namuwikiUrl} target="_blank" rel="noreferrer" className="hover:underline">{polB.name}</a> : polB.name}
                    </h3>
                    <div className="flex gap-2 mt-2 mb-4">
                      <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${colorB}33`, color: colorB }}>{polB.party || '무소속'}</span>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600">{polB.role_type === 'MAYOR' ? '지자체장' : polB.role_type === 'EXTRA_PARLIAMENTARY' ? '원외인사' : '국회의원'}</span>
                    </div>
                    <div className="flex gap-4 mb-4">
                      <button onClick={() => handleEntityInteraction(polB.id, 'politician', 'like')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👍 {polB.likes || 0}</button>
                      <button onClick={() => handleEntityInteraction(polB.id, 'politician', 'dislike')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👎 {polB.dislikes || 0}</button>
                    </div>
                    {/* Score list inside profile for politician */}
                    <div className="w-full bg-slate-900/50 rounded-lg p-3 space-y-2 text-sm">
                      {chartData.map(d => (
                        <div key={d.subject} className="flex justify-between items-center border-b border-slate-700/50 pb-1 last:border-0 last:pb-0">
                          <span className="text-slate-400">{d.subject}</span>
                          <span className="font-bold text-white" style={{ color: colorB }}>{d.B}점</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500">선택된 인물이 없습니다.</div>
                )
              ) : (
                partyB ? (
                  <div className="flex flex-col items-center w-full">
                    <div className="w-24 h-24 rounded-full border-4 mb-3 flex items-center justify-center text-3xl font-black text-white" style={{ borderColor: colorB, backgroundColor: colorB, borderStyle: isSameParty ? 'dashed' : 'solid' }}>
                      {partyB.name.substring(0, 1)}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{partyB.name}</h3>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600 mb-2">소속 인물 {partyB.members.length}명</span>
                    <div className="flex gap-4 mb-4">
                      <button onClick={() => handleEntityInteraction(partyB.name, 'party', 'like')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👍 {partyB.likes || 0}</button>
                      <button onClick={() => handleEntityInteraction(partyB.name, 'party', 'dislike')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👎 {partyB.dislikes || 0}</button>
                    </div>
                    
                    <div className="w-full bg-slate-900/50 rounded-lg p-3 space-y-2 text-sm">
                      <div className="text-[10px] text-slate-500 text-center mb-2 animate-pulse">지표 클릭 시 기여도 상세 확인</div>
                      {chartData.map(d => (
                        <div key={d.subject} onClick={() => setModalData({ metricId: d.id, metricName: d.subject, parties: [partyB] })} className="flex justify-between items-center border-b border-slate-700/50 pb-1 last:border-0 last:pb-0 cursor-pointer hover:bg-slate-800 p-1 rounded transition-colors">
                          <span className="text-slate-300 hover:text-white">{d.subject}</span>
                          <span className="font-bold" style={{ color: colorB }}>{d.B}점</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500">선택된 정당이 없습니다.</div>
                )
              )}
            </div>
          </div>
          
          {/* BOTTOM COMMENTS PANELS */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {viewMode === 'politician' ? (
              <>
                {polA && <CommentsPanel entity={polA} entityType="politician" color={colorA} />}
                {polB && <CommentsPanel entity={polB} entityType="politician" color={colorB} />}
              </>
            ) : (
              <>
                {partyA && <CommentsPanel entity={partyA} entityType="party" color={colorA} />}
                {partyB && <CommentsPanel entity={partyB} entityType="party" color={colorB} />}
              </>
            )}
          </div>

          {/* TREND CHART */}
          <div className="mt-6 md:mt-8 h-[280px] md:h-[400px]">
            <ApprovalTrendChart 
              entityA={viewMode === 'politician' ? polA : partyA}
              entityB={viewMode === 'politician' ? polB : partyB}
              colorA={colorA}
              colorB={colorB}
              isSameParty={isSameParty}
            />
          </div>

          {/* FULL WIDTH METRIC DESCRIPTIONS */}
          <div className="mt-8">
            <div className="p-3 md:p-6 bg-slate-900/50 border border-slate-800 text-xs text-slate-400 rounded-xl">
              <div className="text-slate-400">
                <h4 className="font-bold text-slate-300 mb-2 flex items-center gap-1">
                  <span className="text-[10px]">📊</span> 지표 산출 기준 및 출처 (Beta)
                </h4>
                <ul className="space-y-1.5 pl-1">
                  <li><strong className="text-slate-300">도덕성/청렴:</strong> 선관위 전과기록, 세금 체납액, 재산 축소 신고 의혹 등을 감점 요소로 산출한 자체 지수.</li>
                  <li><strong className="text-slate-300">화제성(SNS):</strong> 네이버 데이터랩 검색어 트렌드 API를 통해 매일 자동 수집되는 실제 검색량 데이터 기반. (0~100 상대 지표)</li>
                  <li><strong className="text-slate-300">대권잠재력:</strong> 리얼미터, 갤럽 등 주요 여론조사 기관의 차기 지도자 선호도 및 당대표 지지도 환산.</li>
                  <li><strong className="text-slate-300">입법/행정:</strong> 열려라 국회(참여연대) 본회의 출석률 및 지자체 공약 이행률 평가 리포트 기반.</li>
                  <li><strong className="text-slate-300">세대별 소구력:</strong> 연령별 지지율 편차를 분석하여 스윙보터(중도층) 확장 가능성을 측정한 AI 평가 지수.</li>
                </ul>
                <p className="mt-3 text-[10px] text-slate-500">* 화제성(버즈) 지표는 네이버 데이터랩 실데이터 기반이며, 기타 지표는 공공 데이터 연동 확대 중입니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {renderModal()}
    </div>
  );
}
