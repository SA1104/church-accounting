import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, TrendingUp, Home, Globe } from 'lucide-react';

const appDetails = {
  stock: {
    title: 'Stock Think',
    subtitle: 'AI 주식 분석 의사결정 플랫폼',
    icon: <TrendingUp size={48} className="text-emerald-400" />,
    description: '글로벌 거래소 시세, 기업 공시 데이터, 재무제표 표준 계측 모델 및 뉴스 감성 통계를 기반으로 개인 및 기관 투자자에게 신뢰도 높은 의사결정 전략을 추천합니다.',
    features: [
      '기업 재무제표 정규화 및 분기별 성장 지표 예측',
      '뉴스, 공시 데이터 기반 형태소 추출 및 언급량-만족도 사분면 분석',
      '설명 가능한 AI(XAI) 매수/매도/보유 등급 결정 및 리스크 경고',
      '거시 경제 지표 및 금리 변동성에 따른 포트폴리오 시뮬레이션'
    ],
    timeline: '2026년 하반기 출시 예정'
  },
  estate: {
    title: 'Estate Think',
    subtitle: 'AI 부동산 가치 분석 플랫폼',
    icon: <Home size={48} className="text-indigo-400" />,
    description: '국토교통부 실거래 정보, KB 시세 동향, 지역별 인구 이동 및 학군/교통망 인프라 만족도 지표를 통합 가공하여 최적의 입지 추천과 주거 의사결정을 지원합니다.',
    features: [
      '국토부 아파트 매매/전세 실거래가 정밀 트렌드 분석',
      '학군 및 지하철 호재에 따른 지역별 시세 파급 효과 시뮬레이션',
      '경매 물건 권리분석 및 낙찰 기대가 Prediction 모델',
      'X축 거래량, Y축 가격 변동률을 활용한 2차원 사분면 입지 평가'
    ],
    timeline: '2026년 하반기 출시 예정'
  },
  mission: {
    title: 'Mission Think',
    subtitle: 'AI 스마트 선교 협력 플랫폼',
    icon: <Globe size={48} className="text-cyan-400" />,
    description: '해외 파견 선교사와 국내 후원 단체를 유기적으로 연결하고, 선교지의 치안 상태, 기후 변동성, 외교부 여행 위험 등급 및 실시간 환율 정보 등을 매핑하여 안전한 사역 환경을 도모합니다.',
    features: [
      '파견 국가별 안전 위험 지수 및 비자 규정 실시간 데이터 소스맵 연동',
      '해외 선교비 송금 환율 변동성 예측 및 알림 기능',
      '선교지 기후 정보 및 현지 문화 융합 도메인 지식 베이스 구축',
      '후원금 집행 내역의 투명한 감사 보고서 생성 및 자동 배포'
    ],
    timeline: '2027년 상반기 출시 예정'
  }
};

export default function PremiumPlaceholder({ appId = 'stock' }) {
  const navigate = useNavigate();
  const info = appDetails[appId] || appDetails.stock;

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12 select-none overflow-y-auto no-scrollbar font-sans">
      {/* Top Navigation */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs font-semibold transition-colors focus:outline-none"
        >
          <ArrowLeft size={14} /> 메인 포털로 돌아가기
        </button>
        <span className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">PREMIUM PLACEHOLDER</span>
      </div>

      {/* Main Content Card */}
      <div className="w-full max-w-2xl mx-auto my-auto py-12 space-y-8 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl shadow-slate-950/50">
            {info.icon}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h1 className="text-3xl font-extrabold text-white">{info.title}</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-extrabold bg-church-500/10 text-church-400 border border-church-500/20 uppercase tracking-widest">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-church-400 font-semibold">{info.subtitle}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900/80 backdrop-blur-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-left">서비스 소개</h3>
            <p className="text-xs text-slate-300 leading-relaxed text-left">{info.description}</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900/80 backdrop-blur-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-left">핵심 제공 예정 기능</h3>
            <ul className="space-y-2 text-left">
              {info.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-church-500 mt-1.5 shrink-0"></div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Release Status Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 text-xs">
          <span className="text-slate-500 font-medium">릴리즈 상태</span>
          <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 mt-2 md:mt-0">
            {info.timeline}
          </span>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="w-full text-center text-[10px] text-slate-600 font-medium max-w-4xl mx-auto mt-6">
        Powered by Booza Think Platform
      </div>
    </div>
  );
}
