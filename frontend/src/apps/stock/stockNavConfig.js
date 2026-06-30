// frontend/src/apps/stock/stockNavConfig.js
// Stock Think - Navigation Config for WorkspaceSidebar (Platform 3.1)
export function getStockNavConfig(user) {
  return [
    {
      to: '/app/stock',
      label: '투자 분석',
      icon: 'TrendingUp',
      exact: true
    },
    {
      to: '/decisions',
      label: 'Decision History',
      icon: 'ShieldCheck',
      accent: true
    },
    { type: 'section', label: 'Research Tools' },
    {
      to: '/app/stock',
      label: 'AI 가치평가',
      icon: 'Cpu',
      action: 'openAIDock',
      accent: true
    },
    {
      type: 'placeholder',
      label: '포트폴리오 — 준비 중'
    },
    {
      type: 'placeholder',
      label: '백테스트 — 준비 중'
    }
  ];
}
