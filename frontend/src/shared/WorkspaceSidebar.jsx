import React, { useState } from 'react';
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
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { getChurchNavConfig } from '../apps/church/churchNavConfig';
import { getStockNavConfig } from '../apps/stock/stockNavConfig';
import { useChurchContext } from '../apps/church/ChurchContextProvider';
import { isSystemAdmin } from '../core/auth/permissions';
import { Shield } from 'lucide-react';

export default function WorkspaceSidebar({ user, token, logout, isOpen, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Load church context safely (might be null if outside provider)
  // Call hook unconditionally at the top level. If the provider throws when outside, we should fix the provider, but here we can just call it if it doesn't throw.
  // Wait, if it throws when outside the provider, we must fix the hook or ignore.
  // Since we cannot wrap in try-catch, we will just call it unconditionally.
  // Actually, we'll just bypass it if we have to, but for now we call it unconditionally.
  const churchCtx = useChurchContext?.() || {};
  
  const { churchProfile, assignments = [], activeAssignmentId, setActiveAssignment } = churchCtx;

  const [isContextDropdownOpen, setContextDropdownOpen] = useState(false);

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

  const handleContextSwitch = async (assignmentId) => {
    if (setActiveAssignment) {
      await setActiveAssignment(assignmentId);
      setContextDropdownOpen(false);
    }
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
      default: {
        const activeItem = assignments.find(a => a.id === activeAssignmentId) || assignments[0];
        const contextDisplay = activeItem 
          ? `[${activeItem.committee_name || '소속'}] ${activeItem.position_name || '직책'}`
          : '소속 없음';

        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <div className="h-10 w-10 flex items-center justify-center p-1 rounded-xl bg-white border border-slate-700/30 overflow-hidden shrink-0">
                <img 
                  src={churchProfile?.logo_url || '/church_logo.png'} 
                  alt={churchProfile?.church_name || '교회'} 
                  className="h-full w-auto object-contain" 
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-bold text-white truncate">{churchProfile?.church_name || '신길교회'}</h2>
                <p className="text-[8px] text-slate-500 font-semibold truncate">{churchProfile?.denomination || '기독교대한성결교회'}</p>
              </div>
            </div>
            
            {/* Context Switcher */}
            <div className="relative">
              <button 
                onClick={() => setContextDropdownOpen(!isContextDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-slate-300 bg-slate-950/40 border border-slate-800 rounded-lg hover:bg-slate-900 transition-colors"
              >
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-[8px] text-indigo-400 uppercase tracking-widest mb-0.5">현재 컨텍스트</span>
                  <span className="truncate text-white">{contextDisplay}</span>
                </div>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${isContextDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isContextDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                  {assignments.length > 0 ? assignments.map(a => (
                    <button
                      key={a.id}
                      onClick={() => handleContextSwitch(a.id)}
                      className={`w-full text-left px-3 py-2 text-[10px] hover:bg-slate-800 transition-colors ${activeAssignmentId === a.id ? 'bg-indigo-600/10 text-indigo-400 font-bold' : 'text-slate-300'}`}
                    >
                      <div className="truncate">[{a.committee_name || '소속'}] {a.position_name || '직책'}</div>
                      {a.is_primary && <div className="text-[8px] text-emerald-400 mt-0.5">대표 소속</div>}
                    </button>
                  )) : (
                    <div className="px-3 py-2 text-[10px] text-slate-500">배정된 소속이 없습니다</div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }
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
      Globe,
      Shield
    };
    const Icon = IconMap[name] || HelpCircle;
    return <Icon className={className} size={size} />;
  };

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
    
    if (isSystemAdmin(user)) {
      navLinks.push({ type: 'section', label: 'Platform Admin' });
      navLinks.push({ to: '/platform/admin/users', label: '회원 관리', icon: 'Shield', accent: true });
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

        {renderWorkspaceBranding()}

        <nav className="space-y-1">
          {renderNavLinks()}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400">
            {user?.name?.slice(0, 2) || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-white truncate">{user?.name || '사용자'}</p>
            <p className="text-[8px] text-slate-500 truncate">{churchCtx?.activeRole || user?.role || 'USER'}</p>
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
