import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Cpu, Bell } from 'lucide-react';
import Signup from './shared/Signup';
import Portal from './shared/Portal';
import PremiumPlaceholder from './shared/PremiumPlaceholder';
import Login from './shared/Login';

// Import newly created platform layout modules
import WorkspaceSidebar from './shared/WorkspaceSidebar';
import CommandPalette from './shared/CommandPalette';
import AICopilotDock from './shared/AICopilotDock';
import NotificationCenter from './shared/NotificationCenter';
import DecisionHistory from './shared/DecisionHistory';

// Church page imports
import Dashboard from './apps/church/pages/Dashboard';
import VoucherForm from './apps/church/pages/VoucherForm';
import VoucherList from './apps/church/pages/VoucherList';
import VoucherDetail from './apps/church/pages/VoucherDetail';
import LedgerView from './apps/church/pages/LedgerView';
import SettlementView from './apps/church/pages/SettlementView';
import AuditView from './apps/church/pages/AuditView';
import Settings from './apps/church/pages/Settings';

// Stock page imports
import StockDashboard from './apps/stock/pages/StockDashboard';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function MobileLayout() {
  const { user, token, logout, fontScale, setFontScale } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Platform layout UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [aiDockOpen, setAiDockOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);

  // Dynamic Workspace Branding state
  const [churchProfile, setChurchProfile] = useState({
    church_name: '신길교회',
    denomination: '기독교대한성결교회',
    primary_color: '#38669b',
    secondary_color: '#2b517d',
    logo_url: '/church_logo.png'
  });

  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/church/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setChurchProfile(data);
        }
      } catch (err) {
        console.error('Error fetching church profile:', err);
      }
    };
    fetchProfile();
  }, [token]);

  // Global key listener for Ctrl + K (Command Palette)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    const interval = setInterval(() => {
      pollNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter(n => n.is_read === 0).length);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  const pollNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter(n => n.is_read === 0).length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic breadcrumbs generation representing the hierarchy: Platform > Workspace > Capability > Screen
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const baseBreadcrumb = (
      <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent font-black tracking-widest text-[9px] md:text-xs">
        BOOZA THINK
      </span>
    );

    let workspace = '신길교회';
    let capability = 'Church Think';
    let screen = 'Dashboard';

    if (path.startsWith('/app/stock')) {
      workspace = '내 투자';
      capability = 'Stock Think';
      screen = 'AI 분석';
    } else if (path.startsWith('/app/estate')) {
      workspace = '서울권';
      capability = 'Estate Think';
      screen = '입지분석';
    } else if (path.startsWith('/app/mission')) {
      workspace = '선교 협력';
      capability = 'Mission Think';
      screen = '안전지수';
    } else {
      workspace = churchProfile.church_name;
      capability = 'Church Think';
      if (path.startsWith('/vouchers/new')) screen = '전표 등록';
      else if (path.startsWith('/vouchers/edit')) screen = '전표 수정';
      else if (path.startsWith('/vouchers/')) screen = '전표 상세';
      else if (path.startsWith('/vouchers')) screen = '전표 목록';
      else if (path.startsWith('/reports/settlement')) screen = '결산 마감';
      else if (path.startsWith('/reports')) screen = '장부 조회';
      else if (path.startsWith('/audit')) screen = '감사위원회';
      else if (path.startsWith('/settings')) screen = '환경설정';
    }

    return (
      <div className="flex items-center gap-1.5 text-[8.5px] md:text-[10px] font-bold text-slate-500 overflow-hidden truncate">
        {baseBreadcrumb}
        <span>&gt;</span>
        <span className="text-slate-300 truncate">{workspace}</span>
        <span>&gt;</span>
        <span className="text-slate-400 truncate">{capability}</span>
        <span>&gt;</span>
        <span className="text-indigo-400 truncate font-extrabold">{screen}</span>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden" style={{ '--church-primary': churchProfile.primary_color }}>
      {/* Workspace Sidebar (Responsive left layout component) */}
      <WorkspaceSidebar 
        user={user} 
        token={token} 
        logout={logout} 
        churchProfile={churchProfile} 
        isOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(false)} 
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Global Platform Header */}
        <header className="glass flex items-center justify-between px-4 py-2.5 z-10 shrink-0 border-b border-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden text-slate-400 hover:text-white p-1 focus:outline-none shrink-0"
              title="메뉴 열기"
            >
              <Menu size={18} />
            </button>
            {getBreadcrumbs()}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Command Palette Trigger */}
            <button 
              onClick={() => setCommandPaletteOpen(true)} 
              className="text-slate-400 hover:text-white p-1.5 focus:outline-none flex items-center gap-1 bg-slate-900/60 border border-slate-800/80 px-2 py-0.5 rounded-lg text-[9px] font-bold"
              title="Command Palette"
            >
              <Search size={11} />
              <span className="hidden sm:inline">검색</span>
              <kbd className="text-slate-600 font-mono scale-90 border-l border-slate-800 pl-1 ml-0.5">Ctrl+K</kbd>
            </button>

            {/* AI Assistant Toggle */}
            <button 
              onClick={() => setAiDockOpen(true)} 
              className="text-slate-400 hover:text-indigo-400 p-1.5 focus:outline-none"
              title="AI Copilot"
            >
              <Cpu size={14} />
            </button>

            {/* Notification Center Toggle */}
            <button 
              onClick={() => setNotificationCenterOpen(true)} 
              className="text-slate-400 hover:text-white p-1.5 relative focus:outline-none"
              title="알림 및 활동 피드"
            >
              <Bell size={14} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full text-[8px] font-bold flex items-center justify-center text-white scale-90 border border-slate-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Route Pages Container */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-6 relative">
          <Routes>
            <Route path="/app/church" element={<Dashboard />} />
            <Route path="/vouchers/new" element={<VoucherForm />} />
            <Route path="/vouchers/edit/:id" element={<VoucherForm />} />
            <Route path="/vouchers" element={<VoucherList />} />
            <Route path="/vouchers/:id" element={<VoucherDetail />} />
            <Route path="/reports" element={<LedgerView />} />
            <Route path="/reports/settlement" element={<SettlementView />} />
            {(user?.role === 'AUDITOR' || user?.role === 'SYSTEM_ADMIN') && <Route path="/audit" element={<AuditView />} />}
            <Route path="/settings" element={<Settings />} />
            <Route path="/decisions" element={<DecisionHistory />} />

            {/* Premium Placeholders (TEAM E) */}
            <Route path="/app/stock" element={<StockDashboard />} />
            <Route path="/app/estate" element={<PremiumPlaceholder appId="estate" />} />
            <Route path="/app/mission" element={<PremiumPlaceholder appId="mission" />} />

            <Route path="*" element={<Navigate to="/app/church" replace />} />
          </Routes>
        </main>
      </div>

      {/* Floating Modals and Panels */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <AICopilotDock isOpen={aiDockOpen} onClose={() => setAiDockOpen(false)} />
      <NotificationCenter isOpen={notificationCenterOpen} onClose={() => setNotificationCenterOpen(false)} />
    </div>
  );
}

export default function App() {
  const safeGetItem = (key, fallback = null) => {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  };

  const safeSetItem = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  };

  const safeRemoveItem = (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  };

  const [token, setToken] = useState(() => safeGetItem('token'));
  const [user, setUser] = useState(() => {
    try {
      const u = safeGetItem('user');
      return u && u !== 'undefined' ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });
  const [fontScale, setFontScale] = useState(() => safeGetItem('font-scale-level', 'normal'));

  useEffect(() => {
    if (token) {
      safeSetItem('token', token);
      safeSetItem('user', JSON.stringify(user));
    } else {
      safeRemoveItem('token');
      safeRemoveItem('user');
    }
  }, [token, user]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-scale-small', 'font-scale-normal', 'font-scale-large', 'font-scale-xlarge');
    root.classList.add(`font-scale-${fontScale}`);
    safeSetItem('font-scale-level', fontScale);
  }, [fontScale]);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, fontScale, setFontScale }}>
      <Router>
        <Routes>
          <Route path="/" element={<PrivateRoute><Portal /></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/*" 
            element={
              <PrivateRoute>
                <MobileLayout />
              </PrivateRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}
