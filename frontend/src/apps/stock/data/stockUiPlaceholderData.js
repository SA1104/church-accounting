// frontend/src/apps/stock/data/stockUiPlaceholderData.js
// 모든 데이터는 UI 예시 목데이터이며 실제 데이터가 아님을 나타내는 isSample 플래그 포함

export const mockStocks = [
  { stockCode: '005930', name: '삼성전자', market: 'KOSPI', sector: '전기전자', price: null, nxtPrice: null, changeRate: null, volume: null, nxtTradable: true, isSample: true },
  { stockCode: '000210', name: 'DL이앤씨', market: 'KOSPI', sector: '건설업', price: null, nxtPrice: null, changeRate: null, volume: null, nxtTradable: true, isSample: true },
  { stockCode: '035420', name: 'NAVER', market: 'KOSPI', sector: '서비스업', price: null, nxtPrice: null, changeRate: null, volume: null, nxtTradable: true, isSample: true },
  { stockCode: '068270', name: '셀트리온', market: 'KOSPI', sector: '의약품', price: null, nxtPrice: null, changeRate: null, volume: null, nxtTradable: true, isSample: true },
  { stockCode: '373220', name: 'LG에너지솔루션', market: 'KOSPI', sector: '전기전자', price: null, nxtPrice: null, changeRate: null, volume: null, nxtTradable: true, isSample: true },
  { stockCode: '000660', name: 'SK하이닉스', market: 'KOSPI', sector: '전기전자', price: null, nxtPrice: null, changeRate: null, volume: null, nxtTradable: true, isSample: true },
  { stockCode: '035720', name: '카카오', market: 'KOSPI', sector: '서비스업', price: null, nxtPrice: null, changeRate: null, volume: null, nxtTradable: true, isSample: true },
  { stockCode: '042700', name: '한미반도체', market: 'KOSPI', sector: '전기전자', price: null, nxtPrice: null, changeRate: null, volume: null, nxtTradable: false, isSample: true },
  { stockCode: '022100', name: '포스코DX', market: 'KOSDAQ', sector: 'IT S/W & SVC', price: null, nxtPrice: null, changeRate: null, volume: null, nxtTradable: true, isSample: true },
  { stockCode: '247540', name: '에코프로비엠', market: 'KOSDAQ', sector: '제조', price: null, nxtPrice: null, changeRate: null, volume: null, nxtTradable: true, isSample: true },
];

export const mockGlossary = [
  { id: 1, term: '시가', definition: '하루 동안의 주식 거래 중 최초로 체결된 가격입니다.', category: '기초', isSample: true },
  { id: 2, term: '고가', definition: '하루 동안의 주식 거래 중 가장 높게 체결된 가격입니다.', category: '기초', isSample: true },
  { id: 3, term: '저가', definition: '하루 동안의 주식 거래 중 가장 낮게 체결된 가격입니다.', category: '기초', isSample: true },
  { id: 4, term: '종가', definition: '하루 동안의 주식 거래 중 마지막으로 체결된 가격입니다.', category: '기초', isSample: true },
  { id: 5, term: '거래량', definition: '하루 동안 매매된 주식의 총 수량입니다.', category: '기초', isSample: true },
  { id: 6, term: '시가총액', definition: '현재 주가에 총 발행 주식 수를 곱한 값으로, 기업의 규모를 나타냅니다.', category: '지표', isSample: true },
  { id: 7, term: 'PER', definition: '주가수익비율(Price Earning Ratio). 현재 주가가 주당순이익의 몇 배인가를 나타냅니다.', category: '지표', isSample: true },
  { id: 8, term: 'PBR', definition: '주가순자산비율(Price Book-value Ratio). 주가가 주당순자산의 몇 배인가를 나타냅니다.', category: '지표', isSample: true },
  { id: 9, term: 'ROE', definition: '자기자본이익률(Return On Equity). 투입한 자기자본 대비 얼마의 이익을 냈는지 나타냅니다.', category: '지표', isSample: true },
  { id: 10, term: '배당수익률', definition: '1주당 배당금을 현재 주가로 나눈 비율입니다.', category: '지표', isSample: true },
];

export const mockCommunityPosts = [
  {
    id: 'sample-1',
    title: 'DL이앤씨 장기 투자 관점 (UI 예시)',
    stockCode: '000210',
    stockName: 'DL이앤씨',
    createdAt: '2023-10-15T09:00:00Z',
    analysisDate: '2023-10-14',
    isBought: true,
    buyPriceRegistered: true,
    summary: '저평가 가치주 관점 접근',
    status: '보유 중', // 보유, 매도, 관찰
    verificationStatus: '검증 대기', // 검증 대기, 가격 데이터 연결 필요, 검증 완료 예정
    commentCount: 12,
    viewCount: 340,
    author: 'ValueInvestor',
    isSample: true
  },
  {
    id: 'sample-2',
    title: '삼성전자 메모리 반도체 사이클 (UI 예시)',
    stockCode: '005930',
    stockName: '삼성전자',
    createdAt: '2023-11-01T14:30:00Z',
    analysisDate: '2023-11-01',
    isBought: false,
    buyPriceRegistered: false,
    summary: '반도체 사이클 턴어라운드 기대',
    status: '관찰',
    verificationStatus: '가격 데이터 연결 필요',
    commentCount: 5,
    viewCount: 120,
    author: 'TechAnalyst',
    isSample: true
  },
  {
    id: 'sample-3',
    title: '카카오 플랫폼 규제 리스크 (UI 예시)',
    stockCode: '035720',
    stockName: '카카오',
    createdAt: '2023-12-05T10:15:00Z',
    analysisDate: '2023-12-04',
    isBought: true,
    buyPriceRegistered: false,
    summary: '규제 리스크로 인한 하방 압력 지속',
    status: '매도',
    verificationStatus: '검증 대기',
    commentCount: 22,
    viewCount: 560,
    author: 'RiskManager',
    isSample: true
  }
];
