export const engines = [
  {
    id: 'decision',
    name: 'Decision Engine',
    description: '의사결정 객체 생성, 생애주기 관리 및 피드백 학습 추적',
    status: 'active',
    version: '1.0.0',
    capabilities: ['church', 'stock', 'estate', 'mission']
  },
  {
    id: 'ai',
    name: 'AI Engine',
    description: 'LLM 추론, 의도 분류 및 컨텍스트 기반 의사결정 추천',
    status: 'active',
    version: '1.0.0',
    capabilities: ['church', 'stock', 'estate', 'mission']
  },
  {
    id: 'knowledge',
    name: 'Knowledge Engine',
    description: '도메인 지식 베이스 검색 및 온톨로지 개체 바인딩',
    status: 'active',
    version: '1.0.0',
    capabilities: ['stock', 'estate']
  },
  {
    id: 'workflow',
    name: 'Workflow Engine',
    description: '결재선 관리, 상태 전이 규칙 제어 및 결재 자동화',
    status: 'active',
    version: '1.0.0',
    capabilities: ['church']
  },
  {
    id: 'ocr',
    name: 'OCR Engine',
    description: '영수증 및 증빙 텍스트 추출, 메타데이터 표준 매핑',
    status: 'active',
    version: '1.0.0',
    capabilities: ['church']
  },
  {
    id: 'report',
    name: 'Report Engine',
    description: 'AI 보고서 초안 생성 및 템플릿 표준 수출',
    status: 'active',
    version: '1.0.0',
    capabilities: ['church', 'stock']
  },
  {
    id: 'notification',
    name: 'Notification Engine',
    description: '의사결정 트리거 알림 및 위험 임계치 경고 전파',
    status: 'active',
    version: '1.0.0',
    capabilities: ['church', 'stock', 'estate', 'mission']
  },
  {
    id: 'automation',
    name: 'Automation Engine',
    description: '스케줄러 작업 및 외부 API 통합 전송 자동 처리',
    status: 'active',
    version: '1.0.0',
    capabilities: ['church', 'mission']
  },
  {
    id: 'media',
    name: 'Media Engine',
    description: '의사결정 보고 시각 자료 및 동적 미디어 랜더링',
    status: 'active',
    version: '1.0.0',
    capabilities: ['mission']
  },
  {
    id: 'search',
    name: 'Search Engine',
    description: '의사결정 객체 및 통합 리포트 유니버셜 역색인 검색',
    status: 'active',
    version: '1.0.0',
    capabilities: ['church', 'stock', 'estate', 'mission']
  }
];
