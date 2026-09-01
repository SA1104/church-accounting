export const plugins = [
  {
    id: 'stock',
    name: '주식 (Stock)',
    status: 'active',
    route: '/service/stock',
    description: '국내/해외 주식 시장 이슈 및 가치 평가',
    keywords: ['삼성전자', '주식', '투자', '배당', '코스피', '나스닥']
  },
  {
    id: 'real_estate',
    name: '부동산 (Estate)',
    status: 'active',
    route: '/service/real_estate',
    description: '부동산 정책, 실거래가 및 입지 분석',
    keywords: ['재건축', '부동산', '아파트', '청약', '실거래가']
  },
  {
    id: 'politics',
    name: '정치 (Politics)',
    status: 'active',
    route: '/service/politics',
    description: '정치 핫이슈 및 정책 분석',
    keywords: ['정치', '선거', '국회', '정책', '여당', '야당']
  },
  {
    id: 'economy',
    name: '경제 (Economy)',
    status: 'active',
    route: '/service/economy',
    description: '거시 경제 동향 및 지표 분석',
    keywords: ['경제', '금리', '물가', '환율', 'GDP', '인플레이션']
  },
  {
    id: 'mission',
    name: '선교 (Mission)',
    status: 'active',
    route: '/service/mission',
    description: '선교지 소식 및 환율/안전 지표 분석',
    keywords: ['선교', '선교사', '환율', '비자', '안전', '단기선교']
  },
  {
    id: 'word_sharing',
    name: '말씀 나눔 (Word)',
    status: 'active',
    route: '/service/word_sharing',
    description: '말씀 묵상 및 커뮤니티',
    keywords: ['말씀', '성경', '묵상', '나눔', '설교', '기도']
  }
];
