// frontend/src/apps/church/churchNavConfig.js
// Church Think - Navigation Config for WorkspaceSidebar (Platform 3.1)
// WorkspaceSidebar injects this array to render capability-specific nav links
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
    },
    {
      to: '/decisions',
      label: 'Decision History',
      icon: 'ShieldCheck',
      accent: true
    },
    {
      to: '/app/church',
      label: 'AI Copilot',
      icon: 'Cpu',
      action: 'openAIDock',
      accent: true
    },
    { type: 'section', label: 'Accounting Tools' },
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
  ];

  if (isAuditor || isAdmin) {
    links.push({
      to: '/audit',
      label: '감사위원회',
      icon: 'CheckSquare'
    });
  }

  if (isAdmin) {
    links.push({
      to: '/settings',
      label: '설정',
      icon: 'Settings'
    });
  }

  return links;
}
