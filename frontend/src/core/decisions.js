export const DECISION_LIFECYCLE = [
  'Generated',
  'Reviewed',
  'Approved',
  'Executed',
  'Measured',
  'Learned',
  'Archived'
];

export const mockDecisions = [
  {
    id: 'dec-001',
    workspaceId: 'ws-shingil',
    workspaceName: '신길교회',
    capabilityId: 'church',
    capabilityName: 'Church Think',
    decisionType: 'BudgetApproval',
    title: '교육부서 여름 성경학교 행사 예산 승인',
    description: '중등부/고등부 공동 예산 상신건으로, 예산 한도 내에서 12%의 예비비 책정을 포함한 여름 성경학교 전체 집행건을 인가합니다.',
    recommendation: '승인 처리하되 교육관 냉방 시설 교체 보조금 500,000원은 추경 회계에서 별도 집행 권장.',
    confidence: 0.94,
    riskLevel: 'LOW',
    evidence: ['부서별 예산 집행 한계 대비표', '2025 여름 성경학교 행사 기획 계획서'],
    relatedObjects: ['voucher-102', 'ledger-501'],
    status: 'Approved',
    owner: '조상연 장로',
    createdAt: '2026-06-25T09:00:00Z',
    approvedAt: '2026-06-25T11:30:00Z',
    executedAt: '2026-06-26T02:00:00Z',
    measuredAt: null,
    feedback: { comments: '교육부서 조기 예산 배정을 통해 준비가 신속히 완료되었습니다.', satisfaction: 5 },
    learningScore: 92,
    history: [
      { status: 'Generated', timestamp: '2026-06-25T09:00:00Z', details: '예산 검토 제안서가 AI에 의해 발행되었습니다.' },
      { status: 'Reviewed', timestamp: '2026-06-25T10:15:00Z', details: '재정위원회의 1차 검토 완료.' },
      { status: 'Approved', timestamp: '2026-06-25T11:30:00Z', details: '당회 당결 최종 승인.' }
    ]
  },
  {
    id: 'dec-002',
    workspaceId: 'ws-invest',
    workspaceName: '내 투자계정',
    capabilityId: 'stock',
    capabilityName: 'Stock Think',
    decisionType: 'AssetAllocation',
    title: '삼성전자 분기 배당 가치 기반 추가 매수 추천',
    description: '삼성전자 주가가 최근 단기 밸류에이션 하단 영역에 도달함에 따라, 향후 배당 수익률 3.8% 기대를 감안한 추가 자산 매수를 제안합니다.',
    recommendation: '보유 현금의 15% 비중으로 분할 매수 실행, 목표 주가 82,000원 설정.',
    confidence: 0.88,
    riskLevel: 'MEDIUM',
    evidence: ['분기 재무 분석 지표 보고서', '업종별 PER-PBR 멀티플 차트'],
    relatedObjects: ['ticker-005930'],
    status: 'Learned',
    owner: '나종민(개인)',
    createdAt: '2026-06-24T14:20:00Z',
    approvedAt: '2026-06-24T15:00:00Z',
    executedAt: '2026-06-24T15:30:00Z',
    measuredAt: '2026-06-28T09:00:00Z',
    feedback: { comments: '매수 이후 2.1% 반등하여 양호한 진입점으로 확인됨.', satisfaction: 4 },
    learningScore: 88,
    history: [
      { status: 'Generated', timestamp: '2026-06-24T14:20:00Z', details: 'AI 가치 평가 모델 진입 시그널 발생.' },
      { status: 'Approved', timestamp: '2026-06-24T15:00:00Z', details: '사용자 매수 주문 승인.' },
      { status: 'Executed', timestamp: '2026-06-24T15:30:00Z', details: '체결 및 포트폴리오 편입 완료.' }
    ]
  },
  {
    id: 'dec-003',
    workspaceId: 'ws-seoul',
    workspaceName: '서울권 분석',
    capabilityId: 'estate',
    capabilityName: 'Estate Think',
    decisionType: 'PropertyPurchase',
    title: '목동 재건축 3단지 실거래가 분석 기반 소형 아파트 매입',
    description: '목동 재건축 3단지 소형 면적의 전세가 비율이 55%를 유지하고 시세 하단 갭이 조밀해짐에 따라 투자 가치가 상승했습니다.',
    recommendation: '재건축 진행 속도를 감안해 24평형 급매물 위주로 갭 매입 실행 권장.',
    confidence: 0.82,
    riskLevel: 'HIGH',
    evidence: ['목동 3단지 실거래가 변동 곡선', '재건축 안전진단 통과 이력'],
    relatedObjects: ['zone-mokdong-3'],
    status: 'Executed',
    owner: '나종민(개인)',
    createdAt: '2026-06-20T10:00:00Z',
    approvedAt: '2026-06-21T09:00:00Z',
    executedAt: '2026-06-23T11:00:00Z',
    measuredAt: null,
    feedback: null,
    learningScore: 0,
    history: [
      { status: 'Generated', timestamp: '2026-06-20T10:00:00Z', details: '실거래 분석기에서 갭 투자 기준 충족 감지.' },
      { status: 'Approved', timestamp: '2026-06-21T09:00:00Z', details: '투자 매입 최종 결정.' },
      { status: 'Executed', timestamp: '2026-06-23T11:00:00Z', details: '매매 계약 체결 및 에스크로 설정.' }
    ]
  }
];

// Helper to filter decisions
export function filterDecisions(decisions, filters = {}) {
  return decisions.filter(d => {
    if (filters.workspaceId && d.workspaceId !== filters.workspaceId) return false;
    if (filters.capabilityId && d.capabilityId !== filters.capabilityId) return false;
    if (filters.status && d.status !== filters.status) return false;
    if (filters.riskLevel && d.riskLevel !== filters.riskLevel) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.decisionType.toLowerCase().includes(q)
      );
    }
    return true;
  });
}
