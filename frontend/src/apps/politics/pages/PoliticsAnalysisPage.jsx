import { useState, useEffect, useRef } from 'react';
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
  if (isAlt) return baseColor;
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
    <div ref={wrapperRef} className="relative w-full mb-4 z-50">
      <div 
        className="w-full bg-slate-900 border text-white rounded-lg p-3 cursor-pointer flex justify-between items-center"
        style={{ borderColor: isOpen ? outlineColor : '#334155' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOpt ? selectedOpt.name : placeholder}</span>
        <span className="text-slate-400">▼</span>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
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

// NEW: Party Leaderboard Component
const PartyLeaderboard = ({ party, color }) => {
  if (!party || !party.members || party.members.length === 0) return null;

  // 1. Calculate Party Average Base Score
  let totalScore = 0;
  party.members.forEach(m => {
    const score = ((m.stats?.approval || 50) + (m.dynamic_metrics?.morality_index || 70) + (m.dynamic_metrics?.sns_power || 50)) / 3;
    totalScore += score;
  });
  const partyAverage = totalScore / party.members.length;

  // 2. Calculate Deviation for each member
  const rankedMembers = party.members.map(m => {
    const personalScore = ((m.stats?.approval || 50) + (m.dynamic_metrics?.morality_index || 70) + (m.dynamic_metrics?.sns_power || 50)) / 3;
    const deviation = personalScore - partyAverage;
    
    // Mock AI reason generation based on stats
    let reason = "당 평균 수준의 기여를 하고 있습니다.";
    if (deviation > 5) {
      if (m.dynamic_metrics?.morality_index > 85) reason = "압도적인 청렴함과 도덕성으로 당의 쇄신 이미지를 견인 중";
      else if (m.dynamic_metrics?.sns_power > 85) reason = "강력한 팬덤과 소셜 파급력으로 지지층을 결집시킴";
      else reason = "안정적인 대국민 호감도로 스윙보터를 흡수 중";
    } else if (deviation < -5) {
      if (m.dynamic_metrics?.morality_index < 60) reason = "연이은 논란과 도덕성 리스크로 중도층 이탈의 핵심 원인";
      else if (m.stats?.approval < 45) reason = "대국민 비호감도가 너무 높아 당의 이미지에 치명적 타격";
      else reason = "화제성 부족 및 존재감 미미로 평균치 하락 주도";
    }

    return { ...m, deviation, reason };
  }).sort((a, b) => b.deviation - a.deviation); // Sort descending

  const mvps = rankedMembers.filter(m => m.deviation >= 0).slice(0, 3);
  const risks = rankedMembers.filter(m => m.deviation < 0).reverse().slice(0, 3); // bottom up to 3

  return (
    <div className="mt-6 space-y-4">
      {mvps.length > 0 && (
        <div className="bg-slate-800/80 rounded-lg p-4 border border-blue-900/50">
          <h4 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
            🏆 명예의 전당 <span className="text-xs font-normal text-slate-400">(기여도 TOP)</span>
          </h4>
          <div className="space-y-3">
            {mvps.map((m, i) => (
              <div key={m.id} className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{m.name} <span className="text-xs font-normal text-green-400 ml-1">+{m.deviation.toFixed(1)}점</span></div>
                  <div className="text-xs text-slate-400 leading-tight mt-1">{m.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {risks.length > 0 && (
        <div className="bg-slate-800/80 rounded-lg p-4 border border-red-900/50">
          <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
            🚨 리스크 주의보 <span className="text-xs font-normal text-slate-400">(훼손도 WORST)</span>
          </h4>
          <div className="space-y-3">
            {risks.map((m, i) => (
              <div key={m.id} className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold border border-red-500/30">
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{m.name} <span className="text-xs font-normal text-red-400 ml-1">{m.deviation.toFixed(1)}점</span></div>
                  <div className="text-xs text-slate-400 leading-tight mt-1">{m.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


export default function PoliticsAnalysisPage() {
  const [viewMode, setViewMode] = useState('party'); // 'politician' | 'party', defaulting to party for this demo
  const [politicians, setPoliticians] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPolA, setSelectedPolA] = useState('');
  const [selectedPolB, setSelectedPolB] = useState('');
  
  const [selectedPartyA, setSelectedPartyA] = useState('');
  const [selectedPartyB, setSelectedPartyB] = useState('');

  useEffect(() => {
    const fetchPoliticians = async () => {
      try {
        const res = await apiClient('/api/services/politics/politicians');
        setPoliticians(res);
        if (res.length >= 2) {
          setSelectedPolA(res[0].id);
          setSelectedPolB(res[1].id);
        }
        
        // Extract unique parties
        const partyMap = new Map();
        res.forEach(p => {
          if (!p.party) return;
          if (!partyMap.has(p.party)) {
            partyMap.set(p.party, { id: p.party, name: p.party, members: [] });
          }
          partyMap.get(p.party).members.push(p);
        });
        
        const partyArray = Array.from(partyMap.values());
        setParties(partyArray);
        
        // Try to default to Minjoo and PPP if available
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

  // POLITICIAN MODE LOGIC
  const polA = politicians.find(p => p.id === selectedPolA);
  const polB = politicians.find(p => p.id === selectedPolB);

  const getPolChartData = (pA, pB) => {
    const roleA = pA?.role_type || 'ASSEMBLY_MEMBER';
    const roleB = pB?.role_type || 'ASSEMBLY_MEMBER';
    
    const isBothAssembly = roleA === 'ASSEMBLY_MEMBER' && roleB === 'ASSEMBLY_MEMBER';
    const isBothMayor = roleA === 'MAYOR' && roleB === 'MAYOR';
    
    if (isBothAssembly) {
      return [
        { subject: '입법 성실도', A: pA ? normalizeScore(pA.stats?.attendance, 100) : 0, B: pB ? normalizeScore(pB.stats?.attendance, 100) : 0, fullMark: 100 },
        { subject: '공약 이행률', A: pA ? normalizeScore(pA.stats?.pledge, 100) : 0, B: pB ? normalizeScore(pB.stats?.pledge, 100) : 0, fullMark: 100 },
        { subject: '도덕성/청렴', A: pA ? (pA.dynamic_metrics?.morality_index || 70) : 0, B: pB ? (pB.dynamic_metrics?.morality_index || 70) : 0, fullMark: 100 },
        { subject: '재력 지수', A: pA ? normalizeScore(pA.stats?.wealth, 5000000000) : 0, B: pB ? normalizeScore(pB.stats?.wealth, 5000000000) : 0, fullMark: 100 },
        { subject: '세대별 소구력', A: pA ? (pA.dynamic_metrics?.demographic_appeal || 50) : 0, B: pB ? (pB.dynamic_metrics?.demographic_appeal || 50) : 0, fullMark: 100 },
        { subject: '당내 영향력', A: pA ? (pA.dynamic_metrics?.party_control || 60) : 0, B: pB ? (pB.dynamic_metrics?.party_control || 60) : 0, fullMark: 100 }
      ];
    }
    
    if (isBothMayor) {
      return [
        { subject: '행정 평가', A: pA ? (pA.dynamic_metrics?.admin_rating || 70) : 0, B: pB ? (pB.dynamic_metrics?.admin_rating || 70) : 0, fullMark: 100 },
        { subject: '도덕성/청렴', A: pA ? (pA.dynamic_metrics?.morality_index || 70) : 0, B: pB ? (pB.dynamic_metrics?.morality_index || 70) : 0, fullMark: 100 },
        { subject: '화제성(SNS)', A: pA ? (pA.dynamic_metrics?.sns_power || 60) : 0, B: pB ? (pB.dynamic_metrics?.sns_power || 60) : 0, fullMark: 100 },
        { subject: '대권 지지율', A: pA ? (pA.dynamic_metrics?.presidential_support || 20) : 0, B: pB ? (pB.dynamic_metrics?.presidential_support || 20) : 0, fullMark: 100 },
        { subject: '세대별 소구력', A: pA ? (pA.dynamic_metrics?.demographic_appeal || 50) : 0, B: pB ? (pB.dynamic_metrics?.demographic_appeal || 50) : 0, fullMark: 100 }
      ];
    }
    
    return [
      { subject: '정치적 체급', A: pA ? (pA.role_type === 'EXTRA_PARLIAMENTARY' || pA.role_type === 'MAYOR' ? 90 : 70) : 0, B: pB ? (pB.role_type === 'EXTRA_PARLIAMENTARY' || pB.role_type === 'MAYOR' ? 90 : 70) : 0, fullMark: 100 },
      { subject: '대권 잠재력', A: pA ? (pA.dynamic_metrics?.presidential_support || 40) : 0, B: pB ? (pB.dynamic_metrics?.presidential_support || 40) : 0, fullMark: 100 },
      { subject: '도덕성/청렴', A: pA ? (pA.dynamic_metrics?.morality_index || 70) : 0, B: pB ? (pB.dynamic_metrics?.morality_index || 70) : 0, fullMark: 100 },
      { subject: '화제성(SNS)', A: pA ? (pA.dynamic_metrics?.sns_power || 60) : 0, B: pB ? (pB.dynamic_metrics?.sns_power || 60) : 0, fullMark: 100 },
      { subject: '세대별 소구력', A: pA ? (pA.dynamic_metrics?.demographic_appeal || 50) : 0, B: pB ? (pB.dynamic_metrics?.demographic_appeal || 50) : 0, fullMark: 100 }
    ];
  };

  // PARTY MODE LOGIC
  const partyA = parties.find(p => p.id === selectedPartyA);
  const partyB = parties.find(p => p.id === selectedPartyB);

  const calculatePartyAverage = (partyObj, metricKey) => {
    if (!partyObj || !partyObj.members || partyObj.members.length === 0) return 0;
    
    let sum = 0;
    let count = 0;
    
    partyObj.members.forEach(m => {
      const weight = (m.role_type === 'EXTRA_PARLIAMENTARY' || m.role_type === 'MAYOR') ? 1.5 : 1.0;
      
      let val = 0;
      if (metricKey === 'approval') val = m.stats?.approval || 50;
      if (metricKey === 'morality') val = m.dynamic_metrics?.morality_index || 70;
      if (metricKey === 'sns_power') val = m.dynamic_metrics?.sns_power || 50;
      if (metricKey === 'demographic') val = m.dynamic_metrics?.demographic_appeal || 50;
      if (metricKey === 'presidential') val = m.dynamic_metrics?.presidential_support || 10;
      
      sum += (val * weight);
      count += weight;
    });
    
    return count > 0 ? (sum / count) : 0;
  };

  const getPartyChartData = (pA, pB) => {
    return [
      { subject: '대국민 호감도', A: calculatePartyAverage(pA, 'approval'), B: calculatePartyAverage(pB, 'approval'), fullMark: 100 },
      { subject: '평균 도덕성', A: calculatePartyAverage(pA, 'morality'), B: calculatePartyAverage(pB, 'morality'), fullMark: 100 },
      { subject: 'SNS 장악력', A: calculatePartyAverage(pA, 'sns_power'), B: calculatePartyAverage(pB, 'sns_power'), fullMark: 100 },
      { subject: '세대별 소구력', A: calculatePartyAverage(pA, 'demographic'), B: calculatePartyAverage(pB, 'demographic'), fullMark: 100 },
      { subject: '대권 잠재력 합', A: calculatePartyAverage(pA, 'presidential') * 2, B: calculatePartyAverage(pB, 'presidential') * 2, fullMark: 100 }
    ];
  };

  const chartData = viewMode === 'politician' ? getPolChartData(polA, polB) : getPartyChartData(partyA, partyB);
  
  let colorA = viewMode === 'politician' ? getPartyColor(polA?.party) : getPartyColor(partyA?.name);
  let colorB = viewMode === 'politician' ? getPartyColor(polB?.party) : getPartyColor(partyB?.name);
  
  let isSameParty = false;
  if (viewMode === 'politician' && polA && polB && polA.party === polB.party) {
    isSameParty = true;
    colorB = getPartyColor(polB?.party, true);
  } else if (viewMode === 'party' && partyA && partyB && partyA.name === partyB.name) {
    isSameParty = true;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">정치 분석 허브</h1>
          <p className="text-slate-400 mt-1">인물 및 정당별 동적 지표 비교 (Radar Analysis)</p>
        </div>
        
        {/* VIEW MODE TOGGLE */}
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 w-max">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'politician' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setViewMode('politician')}
          >
            👤 인물 비교
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'party' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setViewMode('party')}
          >
            🏛️ 정당 비교
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
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
                  <img src={polA.imageUrl} alt={polA.name} className="w-32 h-32 rounded-full object-cover border-4 mb-4 bg-white" style={{ borderColor: colorA }} />
                  <h3 className="text-xl font-bold text-white">{polA.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${colorA}33`, color: colorA }}>{polA.party || '무소속'}</span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600">{polA.role_type === 'MAYOR' ? '지자체장' : polA.role_type === 'EXTRA_PARLIAMENTARY' ? '원외인사' : '국회의원'}</span>
                  </div>
                  <div className="mt-4 w-full space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between"><span>도덕성 지수:</span> <span>{polA.dynamic_metrics?.morality_index || 70}점</span></div>
                    {polA.role_type === 'ASSEMBLY_MEMBER' && (<div className="flex justify-between"><span>출석률:</span> <span>{polA.stats?.attendance}%</span></div>)}
                    <div className="flex justify-between"><span>화제성:</span> <span>{polA.stats?.buzz}</span></div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">선택된 인물이 없습니다.</div>
              )
            ) : (
              partyA ? (
                <div className="flex flex-col w-full">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border-4 mb-3 flex items-center justify-center text-3xl font-black text-white" style={{ borderColor: colorA, backgroundColor: colorA }}>
                      {partyA.name.substring(0, 1)}
                    </div>
                    <h3 className="text-xl font-bold text-white">{partyA.name}</h3>
                    <span className="text-xs font-medium px-2 py-1 rounded-full mt-2 bg-slate-800 text-slate-300 border border-slate-600">소속 인물 {partyA.members.length}명</span>
                  </div>
                  {/* Leaderboard */}
                  <PartyLeaderboard party={partyA} color={colorA} />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">선택된 정당이 없습니다.</div>
              )
            )}
          </div>

          {/* Radar Chart Middle */}
          <div className="flex flex-col w-full bg-slate-950/30 rounded-xl sticky top-6 border border-slate-800">
            <div className="h-[350px] w-full flex justify-center items-center pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={chartData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Radar name={viewMode === 'politician' ? (polA?.name || 'A') : (partyA?.name || 'Party A')} dataKey="A" stroke={colorA} fill={colorA} fillOpacity={0.5} />
                  <Radar name={viewMode === 'politician' ? (polB?.name || 'B') : (partyB?.name || 'Party B')} dataKey="B" stroke={colorB} fill={colorB} fillOpacity={0.5} strokeDasharray={isSameParty ? "5 5" : undefined} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Metric Descriptions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-xs text-slate-400 mt-2 rounded-b-xl">
              <h4 className="font-bold text-slate-300 mb-2 flex items-center gap-1">
                <span className="text-[10px]">📊</span> 지표 산출 기준 및 출처 (Beta)
              </h4>
              <ul className="space-y-1.5 pl-1">
                <li><strong className="text-slate-300">도덕성/청렴:</strong> 선관위 전과기록, 세금 체납액, 재산 축소 신고 의혹 등을 감점 요소로 산출한 자체 지수.</li>
                <li><strong className="text-slate-300">화제성(SNS):</strong> 네이버 데이터랩 검색어 트렌드, 언론 보도량, 유튜브/인스타 해시태그 언급량 종합.</li>
                <li><strong className="text-slate-300">대권/당내 잠재력:</strong> 리얼미터, 갤럽 등 주요 여론조사 기관의 차기 지도자 선호도 및 당대표 지지도 환산.</li>
                <li><strong className="text-slate-300">입법/행정 성실도:</strong> 열려라 국회(참여연대) 본회의 출석률 및 지자체 공약 이행률 평가 리포트 기반.</li>
                <li><strong className="text-slate-300">세대별 소구력:</strong> 연령별 지지율 편차를 분석하여 스윙보터(중도층) 확장 가능성을 측정한 AI 평가 지수.</li>
              </ul>
              <p className="mt-3 text-[10px] text-slate-500">* 본 지표는 현재 데이터 파이프라인 연동 테스트 중인 <span className="text-slate-400 border-b border-slate-600">시뮬레이션(더미) 데이터</span>이며, 곧 실시간 공공 데이터로 전환됩니다.</p>
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
                  <img src={polB.imageUrl} alt={polB.name} className="w-32 h-32 rounded-full object-cover border-4 mb-4 bg-white" style={{ borderColor: colorB, borderStyle: isSameParty ? 'dashed' : 'solid' }} />
                  <h3 className="text-xl font-bold text-white">{polB.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${colorB}33`, color: colorB }}>{polB.party || '무소속'}</span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600">{polB.role_type === 'MAYOR' ? '지자체장' : polB.role_type === 'EXTRA_PARLIAMENTARY' ? '원외인사' : '국회의원'}</span>
                  </div>
                  <div className="mt-4 w-full space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between"><span>도덕성 지수:</span> <span>{polB.dynamic_metrics?.morality_index || 70}점</span></div>
                    {polB.role_type === 'ASSEMBLY_MEMBER' && (<div className="flex justify-between"><span>출석률:</span> <span>{polB.stats?.attendance}%</span></div>)}
                    <div className="flex justify-between"><span>화제성:</span> <span>{polB.stats?.buzz}</span></div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">선택된 인물이 없습니다.</div>
              )
            ) : (
              partyB ? (
                <div className="flex flex-col w-full">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border-4 mb-3 flex items-center justify-center text-3xl font-black text-white" style={{ borderColor: colorB, backgroundColor: colorB, borderStyle: isSameParty ? 'dashed' : 'solid' }}>
                      {partyB.name.substring(0, 1)}
                    </div>
                    <h3 className="text-xl font-bold text-white">{partyB.name}</h3>
                    <span className="text-xs font-medium px-2 py-1 rounded-full mt-2 bg-slate-800 text-slate-300 border border-slate-600">소속 인물 {partyB.members.length}명</span>
                  </div>
                  {/* Leaderboard */}
                  <PartyLeaderboard party={partyB} color={colorB} />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">선택된 정당이 없습니다.</div>
              )
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
