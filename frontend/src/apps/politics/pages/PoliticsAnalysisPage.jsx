import { useState, useEffect } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { apiClient } from '../../../core/api';

const normalizeScore = (value, max) => {
  if (!value) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
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

  // Normalize stats for radar chart (mock normalization for now)
  // Max wealth: 5,000,000,000 (50억)
  const chartData = [
    {
      subject: '입법 성실도',
      A: polA ? normalizeScore(polA.stats?.attendance, 100) : 0,
      B: polB ? normalizeScore(polB.stats?.attendance, 100) : 0,
      fullMark: 100,
    },
    {
      subject: '공약 이행률',
      A: polA ? normalizeScore(polA.stats?.pledge, 100) : 0,
      B: polB ? normalizeScore(polB.stats?.pledge, 100) : 0,
      fullMark: 100,
    },
    {
      subject: '화제성(검색량)',
      A: polA ? normalizeScore(polA.stats?.buzz, 100) : 0,
      B: polB ? normalizeScore(polB.stats?.buzz, 100) : 0,
      fullMark: 100,
    },
    {
      subject: '재력 지수',
      A: polA ? normalizeScore(polA.stats?.wealth, 5000000000) : 0,
      B: polB ? normalizeScore(polB.stats?.wealth, 5000000000) : 0,
      fullMark: 100,
    },
    {
      subject: '긍정 평가',
      A: polA ? normalizeScore(polA.stats?.approval, 100) : 0,
      B: polB ? normalizeScore(polB.stats?.approval, 100) : 0,
      fullMark: 100,
    },
    {
      subject: '당내 영향력',
      A: polA ? 85 : 0, // Mock for now
      B: polB ? 80 : 0,
      fullMark: 100,
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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
            <select 
              className="mb-4 bg-slate-950 border border-slate-700 text-white rounded px-3 py-2 w-full outline-none focus:border-indigo-500"
              value={selectedA}
              onChange={(e) => setSelectedA(e.target.value)}
            >
              {politicians.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {polA && (
              <>
                <img src={polA.imageUrl} alt={polA.name} className="w-32 h-32 rounded-full object-cover border-4 border-indigo-500 mb-4 bg-white" />
                <h3 className="text-xl font-bold text-white">{polA.name}</h3>
                <div className="mt-4 w-full space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between"><span>추정 재산:</span> <span>{polA.stats?.wealth ? (polA.stats.wealth / 100000000).toFixed(0) + '억' : 'N/A'}</span></div>
                  <div className="flex justify-between"><span>출석률:</span> <span>{polA.stats?.attendance}%</span></div>
                  <div className="flex justify-between"><span>화제성:</span> <span>{polA.stats?.buzz}</span></div>
                </div>
              </>
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
                <Radar name={polA?.name || 'A'} dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                <Radar name={polB?.name || 'B'} dataKey="B" stroke="#ec4899" fill="#ec4899" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Politician B Profile */}
          <div className="flex flex-col items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <select 
              className="mb-4 bg-slate-950 border border-slate-700 text-white rounded px-3 py-2 w-full outline-none focus:border-pink-500"
              value={selectedB}
              onChange={(e) => setSelectedB(e.target.value)}
            >
              {politicians.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {polB && (
              <>
                <img src={polB.imageUrl} alt={polB.name} className="w-32 h-32 rounded-full object-cover border-4 border-pink-500 mb-4 bg-white" />
                <h3 className="text-xl font-bold text-white">{polB.name}</h3>
                <div className="mt-4 w-full space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between"><span>추정 재산:</span> <span>{polB.stats?.wealth ? (polB.stats.wealth / 100000000).toFixed(0) + '억' : 'N/A'}</span></div>
                  <div className="flex justify-between"><span>출석률:</span> <span>{polB.stats?.attendance}%</span></div>
                  <div className="flex justify-between"><span>화제성:</span> <span>{polB.stats?.buzz}</span></div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
