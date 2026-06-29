export const mockResearches = [
  {
    id: 'res-101',
    question: '삼성전자 지금 추가 매수 해도 괜찮을까?',
    ticker: '삼성전자',
    market: 'KOSPI',
    portfolio: { holdingPrice: 72000, holdingQuantity: 150 },
    investmentStyle: 'Long-term Growth',
    hypothesis: '단기 주가 과매도 국면 진입 및 배당 메리트 부각으로 분할 추가 매수 적기',
    evidence: [
      { category: 'Financials', title: '분기 영업이익 전분기 대비 14.5% 증가', status: 'Positive' },
      { category: 'Valuation', title: 'PER 11.2배로 5개년 평균 하단 도달', status: 'Positive' },
      { category: 'Sentiment', title: '반도체 공급 과잉 해소 전망 뉴스 우세', status: 'Neutral' },
      { category: 'Technicals', title: 'RSI(14) 지표 32로 과매도 국면 접근', status: 'Positive' }
    ],
    analysis: 'DRAM 가격 하방 지지와 파운드리 수주 회복 가능성이 단기 주가 반등을 지지합니다.',
    decision: {
      id: 'dec-101',
      decisionType: 'StockBuyHoldSell',
      title: '삼성전자 추가 매수 의사결정',
      recommendation: 'BUY (분할 추가 매수)',
      confidence: 0.82,
      riskLevel: 'MEDIUM',
      targetPrice: 78000,
      stopLoss: 64000,
      expectedPeriod: '6 Months',
      status: 'Learned'
    },
    validation: {
      trackedDays: 30,
      targetReached: true,
      stopLossTriggered: false,
      actualPrice30d: 78200,
      accuracyEvaluated: true
    },
    outcome: {
      returnRate: 23.7,
      success: true,
      timestamp: '2026-06-25T04:00:00Z'
    },
    learning: '과매도 시그널(RSI) 기반 분할 매수 전략의 유효성 검증 완료.',
    createdAt: '2026-05-25T09:00:00Z'
  },
  {
    id: 'res-102',
    question: '현대차 매도 시점은 언제로 잡아야 하나?',
    ticker: '현대차',
    market: 'KOSPI',
    portfolio: { holdingPrice: 195000, holdingQuantity: 80 },
    investmentStyle: 'Value Investing',
    hypothesis: '친환경 신차 사이클 호조이나 거시 금리 부담으로 단기 고점 분할 차익 실현 권장',
    evidence: [
      { category: 'Financials', title: '영업이익률 8.4%로 역대 최고치 유지', status: 'Positive' },
      { category: 'Valuation', title: 'PBR 0.65배로 장기 평균 상단 터치', status: 'Neutral' },
      { category: 'Macro', title: '고금리 장기화에 따른 글로벌 차입 구매 수요 둔화 우려', status: 'Negative' },
      { category: 'Technicals', title: '볼린저 밴드 상단 터치 후 거래량 소폭 감소', status: 'Negative' }
    ],
    analysis: '호실적은 선반영되었으며, 환율 효과 둔화 및 금리 영향으로 박스권 상단 저항 예상.',
    decision: {
      id: 'dec-102',
      decisionType: 'StockBuyHoldSell',
      title: '현대차 분할 매도 의사결정',
      recommendation: 'HOLD (목표가 도달 시 분할 매도)',
      confidence: 0.74,
      riskLevel: 'LOW',
      targetPrice: 220000,
      stopLoss: 185000,
      expectedPeriod: '3 Months',
      status: 'Learned'
    },
    validation: {
      trackedDays: 30,
      targetReached: false,
      stopLossTriggered: false,
      actualPrice30d: 202000,
      accuracyEvaluated: true
    },
    outcome: {
      returnRate: 3.5,
      success: true,
      timestamp: '2026-06-27T02:00:00Z'
    },
    learning: '금리 모멘텀 둔화 시 박스권 상단 트레이딩 전략 유효.',
    createdAt: '2026-05-27T10:00:00Z'
  }
];

// Helper to generate mock evidence based on ticker
export function getMockEvidenceForTicker(ticker) {
  const isUS = ['테슬라', '엔비디아'].includes(ticker);
  return [
    { category: 'Financials', title: `${ticker} 분기 매출 예상치 대비 5.8% ${isUS ? '상회' : '부합'}`, status: 'Positive' },
    { category: 'Valuation', title: `PER 멀티플 역사적 평균 대비 12% ${isUS ? '고평가' : '하단 영역'}`, status: isUS ? 'Neutral' : 'Positive' },
    { category: 'Sentiment', title: `최근 주요 증권사 투자의견 상향 리포트 누적`, status: 'Positive' },
    { category: 'Macro', title: `글로벌 금리 인하 정책 속도 조절 가능성 영향`, status: 'Negative' },
    { category: 'Technicals', title: `이동평균선 골든크로스 발생 직후 지지선 테스트`, status: 'Positive' }
  ];
}

// Helper to calculate mock evaluation outcomes
export function simulateOutcome(decision, actualFinalPrice) {
  const startPrice = decision.targetPrice * 0.9; // Base hypothetical entry
  const returnRate = parseFloat((((actualFinalPrice - startPrice) / startPrice) * 100).toFixed(1));
  const success = returnRate >= 10.0; // Success definition
  
  return {
    returnRate,
    success,
    timestamp: new Date().toISOString()
  };
}
