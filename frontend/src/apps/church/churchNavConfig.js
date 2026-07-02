// frontend/src/apps/church/churchNavConfig.js
// Church Think - Navigation Config for WorkspaceSidebar (Platform 3.1)
// WorkspaceSidebar injects this array to render capability-specific nav links
// Feature Toggles (V1.0 Stabilization)
const FEATURES = {
  decisionHistory: false,
  aiCopilot: false
};

export function getChurchNavConfig(user) {
  const role = user?.roles?.accounting || user?.roles?.church_think || user?.accounting?.role || '';
  const isAdmin = user?.isAdmin || role === 'SYSTEM_ADMIN' || role === 'super_admin';
  const isAuditor = role === 'AUDITOR' || role === 'service_admin';

  const links = [
    {
      to: '/app/church',
      label: 'Dashboard',
      icon: 'Home',
      exact: true
    }
  ];

  if (FEATURES.decisionHistory) {
    links.push({
      to: '/decisions',
      label: 'Decision History',
      icon: 'ShieldCheck',
      accent: true
    });
  }

  if (FEATURES.aiCopilot) {
    links.push({
      to: '/app/church',
      label: 'AI Copilot',
      icon: 'Cpu',
      action: 'openAIDock',
      accent: true
    });
  }

  links.push({ type: 'section', label: '회계 관리' });
  
  links.push(
    {
      to: '/vouchers/new',
      label: '회계/전표등록',
      icon: 'PlusCircle'
    },
    {
      to: '/vouchers',
      label: '전표목록',
      icon: 'FileText'
    },
    {
      to: '/reports',
      label: '장부/결산',
      icon: 'BarChart2'
    }
  );

  if (isAuditor || isAdmin) {
    links.push({
      to: '/audit',
      label: '감사위원회',
      icon: 'CheckSquare'
    });
  }

  links.push({ type: 'section', label: '설정' });
  links.push({
    to: '/settings',
    label: '환경설정',
    icon: 'Settings'
  });

  return links;
}
