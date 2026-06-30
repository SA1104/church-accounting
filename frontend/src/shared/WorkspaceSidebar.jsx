import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  PlusCircle, 
  CheckSquare, 
  BarChart2, 
  Settings as SettingsIcon, 
  Cpu, 
  LogOut,
  ChevronRight,
  TrendingUp,
  MapPin,
  Globe,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { getChurchNavConfig } from '../apps/church/churchNavConfig';
import { getStockNavConfig } from '../apps/stock/stockNavConfig';

export default function WorkspaceSidebar({ user, token, logout, churchProfile, isOpen, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveApp = () => {
    if (location.pathname.startsWith('/app/stock')) return 'stock';
    if (location.pathname.startsWith('/app/estate')) return 'estate';
    if (location.pathname.startsWith('/app/mission')) return 'mission';
    return 'church';
  };

  const activeApp = getActiveApp();

  const isActive = (path) => {
    if (path === '/app/church') return location.pathname === '/app/church';
    return location.pathname.startsWith(path);
  };

  // Render Workspace-specific Brand Header
  const renderWorkspaceBranding = () => {
    switch (activeApp) {
      case 'stock':
        return (
          <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
            <div className="h-10 w-10 flex items-center justify-center p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-white truncate">내 투자계정</h2>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Stock Workspace</p>
            </div>
          </div>
        );
      case 'estate':
        return (
          <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
            <div className="h-10 w-10 flex items-center justify-center p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
              <Home size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-white truncate">서울권 분석</h2>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Estate Workspace</p>
            </div>
          </div>
        );
      case 'mission':
        return (
          <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
            <div className="h-10 w-10 flex items-center justify-center p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Globe size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-white truncate">선교 협력</h2>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Mission Workspace</p>
            </div>
          </div>
        );
      case 'church':
      default:
        return (
          <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <div className="h-10 w-10 flex items-center justify-center p-1 rounded-xl bg-white border border-slate-700/30 overflow-hidden shrink-0">
              <img 
                src={churchProfile.logo_url} 
                alt={churchProfile.church_name} 
                className="h-full w-auto object-contain" 
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-white truncate">{churchProfile.church_name}</h2>
              <p className="text-[8px] text-slate-500 font-semibold truncate">{churchProfile.denomination}</p>
            </div>
          </div>
        );
    }
  };

  const IconComponent = ({ name, className, size = 15 }) => {
    const IconMap = {
      Home,
      FileText,
      PlusCircle,
      CheckSquare,
      BarChart2,
      Settings: SettingsIcon,
      Cpu,
      ShieldCheck,
      TrendingUp,
      MapPin,
      Globe
    };
    const Icon = IconMap[name] || HelpCircle;
    return <Icon className={className} size={size} />;
  };

  // Render navigation links based on active Capability
  const renderNavLinks = () => {
    let navLinks = [];
    switch (activeApp) {
      case 'church':
        navLinks = getChurchNavConfig(user);
        break;
      case 'stock':
        navLinks = getStockNavConfig(user);
        break;
      default:
        navLinks = [
          { to: `/app/${activeApp}`, label: '대시보드', icon: 'Home', exact: true },
          { to: '/decisions', label: 'Decision History', icon: 'ShieldCheck', accent: true },
          { type: 'section', label: 'Capability Tools' },
          { type: 'placeholder', label: '준비 중인 도구입니다.' }
        ];
    }

    return (
      <div className="space-y-1 pt-2">
        {navLinks.map((item, idx) => {
          if (item.type === 'section') {
            return (
              <div key={idx} className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-3 pt-4 pb-1">
                {item.label}
              </div>
            );
          }
          if (item.type === 'placeholder') {
            return (
              <div key={idx} className="p-3 text-[10px] text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                {item.label}
              </div>
            );
          }

          return (
            <Link
              key={idx}
              to={item.to}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                isActive(item.to)
                  ? 'bg-indigo-600/15 border-indigo-500/20 text-white font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
              onClick={() => {
                if (item.action === 'openAIDock') {
                  window.dispatchEvent(new CustomEvent('open-ai-copilot'));
                }
                toggleSidebar();
              }}
            >
              <IconComponent name={item.icon} className={item.accent ? "text-indigo-400" : ""} size={15} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-slate-950/80 border-r border-slate-900 p-4 z-40 transform transition-transform duration-300 md:transform-none backdrop-blur-md flex flex-col justify-between ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-900 md:block">
          <span className="text-[10px] font-black tracking-widest bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            BOOZA THINK OS
          </span>
          <button 
            onClick={toggleSidebar} 
            className="md:hidden text-slate-400 hover:text-white text-xs font-bold"
          >
            접기
          </button>
        </div>

        {/* Workspace Brand Block */}
        {renderWorkspaceBranding()}

        {/* Dynamic Navigation Links */}
        <nav className="space-y-1">
          {renderNavLinks()}
        </nav>
      </div>

      {/* Sidebar Footer (User / LogOut) */}
      <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400">
            {user?.name?.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-white truncate">{user?.name}</p>
            <p className="text-[8px] text-slate-500 truncate">{user?.position}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
          title="로그아웃"
        >
          <LogOut size={13} />
        </button>
      </div>
    </aside>
  );
}
