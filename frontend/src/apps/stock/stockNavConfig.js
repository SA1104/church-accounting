// frontend/src/apps/stock/stockNavConfig.js

export const navConfig = [
  { path: '/stock', label: '오늘', mobile: true },
  { path: '/stock/global', label: '글로벌', mobile: false },
  { path: '/stock/korea', label: '한국시장', mobile: true },
  { path: '/stock/stocks', label: '종목', mobile: true },
  { path: '/stock/analysis', label: '분석', mobile: false },
  { path: '/stock/glossary', label: '용어', mobile: false },
  { path: '/stock/community', label: '커뮤니티', mobile: true },
  { path: '/stock/my', label: 'MY', mobile: true },
];

export function getStockNavConfig() {
  return [
    {
      to: '/stock',
      label: 'Stock Think',
      icon: 'TrendingUp',
      exact: true
    },
    {
      to: '/decisions',
      label: 'Decision History',
      icon: 'ShieldCheck',
      accent: true
    }
  ];
}
