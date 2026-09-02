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
  '더불어민주당': { primary: '#1D4ED8', lighter: '#60A5FA' }, // Blue
  '국민의힘': { primary: '#E11D48', lighter: '#FB7185' }, // Red
  '조국혁신당': { primary: '#1E3A8A', lighter: '#3B82F6' }, // Deep Blue
  '개혁신당': { primary: '#F97316', lighter: '#FDBA74' }, // Orange
  'default': { primary: '#64748B', lighter: '#94A3B8' }
};

const getPartyColor = (partyName, isSecondary = false) => {
  const scheme = PARTY_COLORS[partyName] || PARTY_COLORS['default'];
  return isSecondary ? scheme.lighter : scheme.primary;
};

const SearchableSelect = ({ options, value, onChange, placeholder, outlineColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  
  const selectedOption = options.find(o => o.id === value);
  
  const filtered = options.filter(o => 
    o.name.includes(search) || (o.party && o.party.includes(search))
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full mb-4" ref={wrapperRef}>
      <div 
        className="bg-slate-950 border text-white rounded px-3 py-2 w-full cursor-pointer flex justify-between items-center transition-colors"
        style={{ borderColor: isOpen ? outlineColor : '#334155' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? `${selectedOption.name} (${selectedOption.party || '무소속'})` : placeholder}</span>
        <span className="text-slate-400 text-xs">▼</span>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-700 rounded shadow-xl max-h-60 flex flex-col overflow-hidden">
          <div className="p-2 bg-slate-900 border-b border-slate-700 shrink-0">
            <input
              type="text"
              className="w-full bg-slate-950 text-white px-2 py-1.5 rounded outline-none border border-slate-800 text-sm focus:border-slate-600 transition-colors"
              placeholder="이름 또는 정당 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map(opt => (
              <div
                key={opt.id}
                className="px-3 py-2 hover:bg-slate-800 cursor-pointer flex justify-between items-center text-sm border-b border-slate-800/50 last:border-0"
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                <span className="font-bold text-slate-100">{opt.name}</span>
                <span className="text-slate-400 text-xs">{opt.party || '무소속'}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-slate-500 text-sm">검색 결과가 없습니다.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function PoliticsAnalysisPage() {
  const [politicians, setPoliticians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');

  useEffect(() => {
    const fetchPoliticians = async () => {
      try {
        const res = await apiClient('/api/services/politics/politicians');
        setPoliticians(res);
        if (res.length >= 2) {
          setSelectedA(res[0].id);
          setSelectedB(res[1].id);
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

  const polA = politicians.find(p => p.id === selectedA);
  const polB = politicians.find(p => p.id === selectedB);

  // Normalize stats for radar chart
  const getDynamicChartData = (pA, pB) => {
    // Determine the chart mode based on roles
    // If both are ASSEMBLY_MEMBER, use the standard legislative chart
    const roleA = pA?.role_type || 'ASSEMBLY_MEMBER';
    const roleB = pB?.role_type || 'ASSEMBLY_MEMBER';
    
    const isBothAssembly = roleA === 'ASSEMBLY_MEMBER' && roleB === 'ASSEMBLY_MEMBER';
    const isBothMayor = roleA === 'MAYOR' && roleB === 'MAYOR';
    
    if (isBothAssembly) {
      return [
        { subject: '입법 성실도', A: pA ? normalizeScore(pA.stats?.attendance, 100) : 0, B: pB ? normalizeScore(pB.stats?.attendance, 100) : 0, fullMark: 100 },
        { subject: '공약 이행률', A: pA ? normalizeScore(pA.stats?.pledge, 100) : 0, B: pB ? normalizeScore(pB.stats?.pledge, 100) : 0, fullMark: 100 },
        { subject: '화제성(검색량)', A: pA ? normalizeScore(pA.stats?.buzz, 100) : 0, B: pB ? normalizeScore(pB.stats?.buzz, 100) : 0, fullMark: 100 },
        { subject: '재력 지수', A: pA ? normalizeScore(pA.stats?.wealth, 5000000000) : 0, B: pB ? normalizeScore(pB.stats?.wealth, 5000000000) : 0, fullMark: 100 },
        { subject: '긍정 평가', A: pA ? normalizeScore(pA.stats?.approval, 100) : 0, B: pB ? normalizeScore(pB.stats?.approval, 100) : 0, fullMark: 100 },
        { subject: '당내 영향력', A: pA ? 85 : 0, B: pB ? 80 : 0, fullMark: 100 }
      ];
    }
    
    if (isBothMayor) {
      return [
        { subject: '행정 평가', A: pA ? (pA.dynamic_metrics?.admin_rating || 0) : 0, B: pB ? (pB.dynamic_metrics?.admin_rating || 0) : 0, fullMark: 100 },
        { subject: '예산 집행률', A: pA ? (pA.dynamic_metrics?.budget_execution || 0) : 0, B: pB ? (pB.dynamic_metrics?.budget_execution || 0) : 0, fullMark: 100 },
        { subject: '화제성(검색량)', A: pA ? normalizeScore(pA.stats?.buzz, 100) : 0, B: pB ? normalizeScore(pB.stats?.buzz, 100) : 0, fullMark: 100 },
        { subject: '대권 지지율', A: pA ? (pA.dynamic_metrics?.presidential_support || 0) : 0, B: pB ? (pB.dynamic_metrics?.presidential_support || 0) : 0, fullMark: 100 },
        { subject: '호감도', A: pA ? normalizeScore(pA.stats?.approval, 100) : 0, B: pB ? normalizeScore(pB.stats?.approval, 100) : 0, fullMark: 100 }
      ];
    }
    
    // Cross-role or Extra-parliamentary comparison (Common Metrics)
    return [
      { subject: '정치적 체급', A: pA ? (pA.role_type === 'EXTRA_PARLIAMENTARY' || pA.role_type === 'MAYOR' ? 90 : 70) : 0, B: pB ? (pB.role_type === 'EXTRA_PARLIAMENTARY' || pB.role_type === 'MAYOR' ? 90 : 70) : 0, fullMark: 100 },
      { subject: '대권 잠재력', A: pA ? (pA.dynamic_metrics?.presidential_support || 40) : 0, B: pB ? (pB.dynamic_metrics?.presidential_support || 40) : 0, fullMark: 100 },
      { subject: '화제성(검색량)', A: pA ? normalizeScore(pA.stats?.buzz, 100) : 0, B: pB ? normalizeScore(pB.stats?.buzz, 100) : 0, fullMark: 100 },
      { subject: '당내 장악력', A: pA ? (pA.dynamic_metrics?.party_control || 75) : 0, B: pB ? (pB.dynamic_metrics?.party_control || 75) : 0, fullMark: 100 },
      { subject: '호감도', A: pA ? normalizeScore(pA.stats?.approval, 100) : 0, B: pB ? normalizeScore(pB.stats?.approval, 100) : 0, fullMark: 100 }
    ];
  };

  const chartData = getDynamicChartData(polA, polB);

  let colorA = getPartyColor(polA?.party);
  let colorB = getPartyColor(polB?.party);
  let isSameParty = false;

  if (polA && polB && polA.party === polB.party) {
    isSameParty = true;
    colorB = getPartyColor(polB?.party, true);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">정치인 비교 분석</h1>
          <p className="text-slate-400 mt-1">데이터 기반 정치인 역량 방사형 차트</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Politician A Profile */}
          <div className="flex flex-col items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <SearchableSelect 
              options={politicians} 
              value={selectedA} 
              onChange={setSelectedA} 
              placeholder="정치인 선택..." 
              outlineColor={colorA}
            />
            {polA ? (
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
                  <div className="flex justify-between"><span>추정 재산:</span> <span>{polA.stats?.wealth ? (polA.stats.wealth / 100000000).toFixed(0) + '억' : 'N/A'}</span></div>
                  {polA.role_type === 'ASSEMBLY_MEMBER' && (
                    <div className="flex justify-between"><span>출석률:</span> <span>{polA.stats?.attendance}%</span></div>
                  )}
                  <div className="flex justify-between"><span>화제성:</span> <span>{polA.stats?.buzz}</span></div>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">선택된 정치인이 없습니다.</div>
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
                  name={polA?.name || 'A'} 
                  dataKey="A" 
                  stroke={colorA} 
                  fill={colorA} 
                  fillOpacity={0.5} 
                />
                <Radar 
                  name={polB?.name || 'B'} 
                  dataKey="B" 
                  stroke={colorB} 
                  fill={colorB} 
                  fillOpacity={0.5} 
                  strokeDasharray={isSameParty ? "5 5" : undefined}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Politician B Profile */}
          <div className="flex flex-col items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <SearchableSelect 
              options={politicians} 
              value={selectedB} 
              onChange={setSelectedB} 
              placeholder="정치인 선택..." 
              outlineColor={colorB}
            />
            {polB ? (
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
                  <div className="flex justify-between"><span>추정 재산:</span> <span>{polB.stats?.wealth ? (polB.stats.wealth / 100000000).toFixed(0) + '억' : 'N/A'}</span></div>
                  {polB.role_type === 'ASSEMBLY_MEMBER' && (
                    <div className="flex justify-between"><span>출석률:</span> <span>{polB.stats?.attendance}%</span></div>
                  )}
                  <div className="flex justify-between"><span>화제성:</span> <span>{polB.stats?.buzz}</span></div>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">선택된 정치인이 없습니다.</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
