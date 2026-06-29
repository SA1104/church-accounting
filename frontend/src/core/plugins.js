export const plugins = [
  {
    id: 'church',
    name: 'Church Think',
    status: 'active',
    defaultWorkspace: '신길교회',
    route: '/app/church',
    description: '교회 회계, 전자결재, 감사, 예산 관리',
    tools: ['회계', '전자결재', '예산', '감사'],
    keywords: ['교회', '예산', '헌금', '지출', '결산', '전표', '장부']
  },
  {
    id: 'stock',
    name: 'Stock Think',
    status: 'coming-soon',
    defaultWorkspace: '내 투자계정',
    route: '/app/stock',
    description: '주식 분석, 포트폴리오, 가치평가',
    tools: ['AI 가치평가', '포트폴리오'],
    keywords: ['삼성전자', '주식', '투자', '가치', '포트폴리오']
  },
  {
    id: 'estate',
    name: 'Estate Think',
    status: 'coming-soon',
    defaultWorkspace: '서울권 분석',
    route: '/app/estate',
    description: '부동산, 재건축, 실거래가, 입지 분석',
    tools: ['실거래가', '입지분석'],
    keywords: ['재건축', '부동산', '아파트', '목동', '실거래가']
  },
  {
    id: 'mission',
    name: 'Mission Think',
    status: 'coming-soon',
    defaultWorkspace: '선교 협력',
    route: '/app/mission',
    description: '선교 일정, 환율, 안전지수, 송금 알림',
    tools: ['안전지수', '송금알림'],
    keywords: ['선교', '선교사', '환율', '비자', '안전']
  },
  {
    id: 'medical',
    name: 'Medical Think',
    status: 'stub',
    defaultWorkspace: '의료 협력',
    route: '/app/medical',
    description: '향후 확장 예정',
    tools: [],
    keywords: []
  },
  {
    id: 'legal',
    name: 'Legal Think',
    status: 'stub',
    defaultWorkspace: '법률 검토',
    route: '/app/legal',
    description: '향후 확장 예정',
    tools: [],
    keywords: []
  }
];
