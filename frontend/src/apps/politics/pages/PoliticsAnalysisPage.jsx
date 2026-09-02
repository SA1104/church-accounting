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
  if (isAlt) {
    // If same party, return a slightly different shade or we handle it via strokeDasharray
    return baseColor;
  }
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

export default function PoliticsAnalysisPage() {
  const [viewMode, setViewMode] = useState('politician'); // 'politician' | 'party'
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
        if (partyArray.length >= 2) {
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
    
    // Default metrics with new fallback properties if not set
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
    
    // Cross-role or Extra-parliamentary comparison (Common Metrics)
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
      // Use weight 1.5 for extra parliamentary/mayors as they are heavyweights
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* PROFILE A */}
          <div className="flex flex-col items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700 h-full">
            {viewMode === 'politician' ? (
              <SearchableSelect 
                options={politicians} 
                value={selectedPolA} 
                onChange={setSelectedPolA} 
                placeholder="정치인 선택..." 
                outlineColor={colorA}
              />
            ) : (
              <SearchableSelect 
                options={parties} 
                value={selectedPartyA} 
                onChange={setSelectedPartyA} 
                placeholder="정당 선택..." 
                outlineColor={colorA}
              />
            )}
            
            {viewMode === 'politician' ? (
              polA ? (
                <>
                  <img 
                    src={polA.imageUrl} 
                    alt={polA.name} 
                    className="w-32 h-32 rounded-full object-cover border-4 mb-4 bg-white" 
                    style={{ borderColor: colorA }}
                  />
                  <h3 className="text-xl font-bold text-white">{polA.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${colorA}33`, color: colorA }}>
                      {polA.party || '무소속'}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600">
                      {polA.role_type === 'MAYOR' ? '지자체장' : polA.role_type === 'EXTRA_PARLIAMENTARY' ? '원외인사' : '국회의원'}
                    </span>
                  </div>
                  <div className="mt-4 w-full space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between"><span>도덕성 지수:</span> <span>{polA.dynamic_metrics?.morality_index || 70}점</span></div>
                    {polA.role_type === 'ASSEMBLY_MEMBER' && (
                      <div className="flex justify-between"><span>출석률:</span> <span>{polA.stats?.attendance}%</span></div>
                    )}
                    <div className="flex justify-between"><span>화제성:</span> <span>{polA.stats?.buzz}</span></div>
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">선택된 인물이 없습니다.</div>
              )
            ) : (
              partyA ? (
                <>
                  <div 
                    className="w-32 h-32 rounded-full border-4 mb-4 flex items-center justify-center text-4xl font-black text-white" 
                    style={{ borderColor: colorA, backgroundColor: colorA }}
                  >
                    {partyA.name.substring(0, 1)}
                  </div>
                  <h3 className="text-xl font-bold text-white">{partyA.name}</h3>
                  <span className="text-xs font-medium px-2 py-1 rounded-full mt-2 bg-slate-800 text-slate-300 border border-slate-600">
                    소속 인물 {partyA.members.length}명
                  </span>
                  <div className="mt-4 w-full space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between"><span>당내 최고 호감도:</span> <span>{Math.max(...partyA.members.map(m => m.stats?.approval || 0)).toFixed(0)}점</span></div>
                    <div className="flex justify-between"><span>당내 최고 화제성:</span> <span>{Math.max(...partyA.members.map(m => m.stats?.buzz || 0)).toFixed(0)}</span></div>
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">선택된 정당이 없습니다.</div>
              )
            )}
          </div>

          {/* Radar Chart Middle */}
          <div className="h-[400px] w-full flex justify-center items-center bg-slate-950/30 rounded-xl">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Radar 
                  name={viewMode === 'politician' ? (polA?.name || 'A') : (partyA?.name || 'Party A')} 
                  dataKey="A" 
                  stroke={colorA} 
                  fill={colorA} 
                  fillOpacity={0.5} 
                />
                <Radar 
                  name={viewMode === 'politician' ? (polB?.name || 'B') : (partyB?.name || 'Party B')} 
                  dataKey="B" 
                  stroke={colorB} 
                  fill={colorB} 
                  fillOpacity={0.5} 
                  strokeDasharray={isSameParty ? "5 5" : undefined}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* PROFILE B */}
          <div className="flex flex-col items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700 h-full">
            {viewMode === 'politician' ? (
              <SearchableSelect 
                options={politicians} 
                value={selectedPolB} 
                onChange={setSelectedPolB} 
                placeholder="정치인 선택..." 
                outlineColor={colorB}
              />
            ) : (
              <SearchableSelect 
                options={parties} 
                value={selectedPartyB} 
                onChange={setSelectedPartyB} 
                placeholder="정당 선택..." 
                outlineColor={colorB}
              />
            )}
            
            {viewMode === 'politician' ? (
              polB ? (
                <>
                  <img 
                    src={polB.imageUrl} 
                    alt={polB.name} 
                    className="w-32 h-32 rounded-full object-cover border-4 mb-4 bg-white" 
                    style={{ borderColor: colorB, borderStyle: isSameParty ? 'dashed' : 'solid' }}
                  />
                  <h3 className="text-xl font-bold text-white">{polB.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${colorB}33`, color: colorB }}>
                      {polB.party || '무소속'}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600">
                      {polB.role_type === 'MAYOR' ? '지자체장' : polB.role_type === 'EXTRA_PARLIAMENTARY' ? '원외인사' : '국회의원'}
                    </span>
                  </div>
                  <div className="mt-4 w-full space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between"><span>도덕성 지수:</span> <span>{polB.dynamic_metrics?.morality_index || 70}점</span></div>
                    {polB.role_type === 'ASSEMBLY_MEMBER' && (
                      <div className="flex justify-between"><span>출석률:</span> <span>{polB.stats?.attendance}%</span></div>
                    )}
                    <div className="flex justify-between"><span>화제성:</span> <span>{polB.stats?.buzz}</span></div>
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">선택된 인물이 없습니다.</div>
              )
            ) : (
              partyB ? (
                <>
                  <div 
                    className="w-32 h-32 rounded-full border-4 mb-4 flex items-center justify-center text-4xl font-black text-white" 
                    style={{ borderColor: colorB, backgroundColor: colorB, borderStyle: isSameParty ? 'dashed' : 'solid' }}
                  >
                    {partyB.name.substring(0, 1)}
                  </div>
                  <h3 className="text-xl font-bold text-white">{partyB.name}</h3>
                  <span className="text-xs font-medium px-2 py-1 rounded-full mt-2 bg-slate-800 text-slate-300 border border-slate-600">
                    소속 인물 {partyB.members.length}명
                  </span>
                  <div className="mt-4 w-full space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between"><span>당내 최고 호감도:</span> <span>{Math.max(...partyB.members.map(m => m.stats?.approval || 0)).toFixed(0)}점</span></div>
                    <div className="flex justify-between"><span>당내 최고 화제성:</span> <span>{Math.max(...partyB.members.map(m => m.stats?.buzz || 0)).toFixed(0)}</span></div>
                  </div>
                </>
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
