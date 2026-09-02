import React, { useState } from 'react';
import { FileText, TrendingUp, TrendingDown, Users, ChevronRight, Activity } from 'lucide-react';

// Mock Data for Bills
const MOCK_BILLS = [
  {
    id: 'b-101',
    title: '금융투자소득세 폐지 및 소득세법 일부개정안',
    proposer: '한동훈',
    party: '국민의힘',
    proposerImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png',
    date: '2026-06-15',
    status: 'COMMITTEE', // PROPOSED -> COMMITTEE -> JUDICIARY -> PLENARY -> PROMULGATED
    durationDays: 85,
    summary: '주식, 채권, 펀드 등 금융투자로 발생한 소득에 대해 과세하는 금융투자소득세를 전면 폐지하고 기존 증권거래세 체계를 유지하는 법안.',
    impact: {
      type: 'POSITIVE',
      sector: '국내 주식시장 전반 (KOSPI/KOSDAQ)',
      aiComment: '금투세 폐지가 확정될 경우 연말 개인투자자의 대규모 이탈 리스크가 해소되며, 특히 증권주 및 시가총액 상위 대형주에 긍정적인 수급 효과가 기대됩니다.'
    },
    opposition: [
      { name: '진성준', party: '더불어민주당' }
    ]
  },
  {
    id: 'b-102',
    title: '인공지능(AI) 산업 육성 및 신뢰 기반 조성에 관한 기본법',
    proposer: '안철수',
    party: '국민의힘',
    proposerImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png',
    date: '2026-08-02',
    status: 'JUDICIARY', 
    durationDays: 32,
    summary: 'AI 기술 발전과 산업 육성을 위한 국가 차원의 지원 근거를 마련하고, 고위험 AI에 대한 신뢰성 확보 및 부작용 방지 규제를 포괄하는 기본법.',
    impact: {
      type: 'NEUTRAL',
      sector: 'AI 솔루션, 반도체 팹리스, 데이터 센터',
      aiComment: '산업 육성(보조금, 세제혜택) 측면에서는 호재이나, 고위험 AI 규제 조항으로 인해 일부 소형 스타트업의 컴플라이언스 비용 증가가 예상됩니다. 대형 플랫폼 기업들에게는 불확실성 해소로 작용합니다.'
    },
    opposition: []
  },
  {
    id: 'b-103',
    title: '도시 및 주거환경정비법 일부개정법률안 (재건축 초과이익 환수 완화)',
    proposer: '이재명',
    party: '더불어민주당',
    proposerImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png',
    date: '2026-07-20',
    status: 'PROPOSED', 
    durationDays: 45,
    summary: '재건축 부담금 면제 기준을 상향하고 부과 구간을 확대하여, 1주택 장기 보유자의 재건축 부담을 대폭 경감하는 법안.',
    impact: {
      type: 'POSITIVE',
      sector: '건설주, 건자재, 강남/분당 재건축 시장',
      aiComment: '법안 통과 시 서울 주요 도심의 노후 단지 재건축 속도가 가속화될 전망입니다. 대형 건설사의 수주 증가 및 시멘트, 인테리어 등 건자재 섹터의 실적 턴어라운드가 기대됩니다.'
    },
    opposition: []
  }
];

const STAGES = [
  { id: 'PROPOSED', label: '발의' },
  { id: 'COMMITTEE', label: '상임위' },
  { id: 'JUDICIARY', label: '법사위' },
  { id: 'PLENARY', label: '본회의' },
  { id: 'PROMULGATED', label: '공포' }
];

const BillProgressBar = ({ currentStatus, durationDays }) => {
  const currentIndex = STAGES.findIndex(s => s.id === currentStatus);
  
  return (
    <div className="w-full py-6">
      <div className="relative flex items-center justify-between w-full">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full"></div>
        
        {/* Active Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full transition-all duration-1000"
          style={{ width: \`\${(currentIndex / (STAGES.length - 1)) * 100}%\` }}
        ></div>

        {/* Nodes */}
        {STAGES.map((stage, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={\`w-4 h-4 rounded-full border-2 transition-all duration-500 \${
                  isActive 
                    ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                    : 'bg-slate-900 border-slate-700'
                }\`}
              >
                {isCurrent && (
                  <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-indigo-500/30 animate-ping"></div>
                )}
              </div>
              <span className={\`text-[10px] md:text-xs font-bold absolute top-6 whitespace-nowrap \${
                isActive ? 'text-white' : 'text-slate-500'
              }\`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Warning if stuck */}
      <div className="mt-8 text-right">
        {durationDays > 60 ? (
          <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
            ⏳ {STAGES[currentIndex].label} 계류 중 ({durationDays}일째)
          </span>
        ) : (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
            ⚡ 원활한 진행 중 ({durationDays}일 소요)
          </span>
        )}
      </div>
    </div>
  );
};

export default function BillTrackerPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBills = MOCK_BILLS.filter(bill => 
    bill.title.includes(searchTerm) || bill.proposer.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
            <FileText size={24} className="text-indigo-400" /> 입법/법안 진행 트래커
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            시장에 영향을 미치는 주요 법안의 진행 상황과 투자 영향도를 실시간으로 추적합니다.
          </p>
        </div>
        <div className="w-full md:w-64">
          <input 
            type="text" 
            placeholder="법안명 또는 발의자 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredBills.map(bill => (
          <div key={bill.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-900/50 transition-colors">
            
            {/* Header */}
            <div className="p-5 md:p-6 border-b border-slate-800/80">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-slate-100 leading-tight mb-2">
                    {bill.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <FileText size={14} /> 발의일: {bill.date}
                    </span>
                    <span className="text-slate-600">|</span>
                    <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-md cursor-pointer hover:bg-slate-700 transition-colors border border-slate-700">
                      <img src={bill.proposerImg} alt={bill.proposer} className="w-4 h-4 rounded-full bg-white" />
                      <span className="font-bold text-slate-300">{bill.proposer}</span>
                      <span className="text-slate-500">({bill.party})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-8 py-4 bg-slate-950/30">
              <BillProgressBar currentStatus={bill.status} durationDays={bill.durationDays} />
            </div>

            {/* AI Analysis */}
            <div className="p-5 md:p-6 bg-indigo-950/10 border-t border-slate-800/80">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Summary */}
                <div className="col-span-1 md:col-span-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <FileText size={14} /> 법안 핵심 요약
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {bill.summary}
                  </p>
                </div>

                {/* AI Impact */}
                <div className="col-span-1 md:col-span-8 bg-slate-900 rounded-xl p-4 border border-indigo-500/20 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-500"></div>
                  
                  <div className="flex items-center justify-between mb-3 pl-3">
                    <h4 className="text-xs font-black text-indigo-400 flex items-center gap-1">
                      <Activity size={14} /> AI 투자 영향도 분석
                    </h4>
                    
                    <div className={\`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold \${
                      bill.impact.type === 'POSITIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      bill.impact.type === 'NEGATIVE' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }\`}>
                      {bill.impact.type === 'POSITIVE' && <TrendingUp size={14} />}
                      {bill.impact.type === 'NEGATIVE' && <TrendingDown size={14} />}
                      {bill.impact.type === 'NEUTRAL' && <ChevronRight size={14} />}
                      {bill.impact.sector}
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-200 leading-relaxed pl-3">
                    {bill.impact.aiComment}
                  </p>
                </div>

              </div>
            </div>

          </div>
        ))}

        {filteredBills.length === 0 && (
          <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
            <FileText size={32} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">검색된 법안이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
