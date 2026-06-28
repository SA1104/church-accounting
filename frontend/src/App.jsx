import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, PlusCircle, CheckSquare, BarChart2, Settings as SettingsIcon, LogOut, User, Bell } from 'lucide-react';
import Signup from './shared/Signup';
import Portal from './shared/Portal';
import PremiumPlaceholder from './shared/PremiumPlaceholder';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

import Login from './shared/Login';
import Dashboard from './apps/church/pages/Dashboard';
import VoucherForm from './apps/church/pages/VoucherForm';
import VoucherList from './apps/church/pages/VoucherList';
import VoucherDetail from './apps/church/pages/VoucherDetail';
import LedgerView from './apps/church/pages/LedgerView';
import SettlementView from './apps/church/pages/SettlementView';
import AuditView from './apps/church/pages/AuditView';
import Settings from './apps/church/pages/Settings';

import StockDashboard from './apps/stock/pages/StockDashboard';
import EstateDashboard from './apps/estate/pages/EstateDashboard';
import MissionDashboard from './apps/mission/pages/MissionDashboard';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function MobileLayout() {
  const { user, token, logout, fontScale, setFontScale } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 동적 교회 테넌트 브랜딩 프로필 데이터 상태 (TEAM B & TEAM G)
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

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

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
        const prevUnreadIds = notifications.filter(n => n.is_read === 0).map(n => n.notification_id);
        const currentUnread = data.filter(n => n.is_read === 0);
        
        const newNotifications = currentUnread.filter(n => !prevUnreadIds.includes(n.notification_id));
        if (newNotifications.length > 0) {
          newNotifications.forEach(n => {
            if (Notification.permission === 'granted') {
              new Notification('신길교회 스마트 회계 알림', {
                body: n.message,
                icon: '/pwa-192x192.png'
              });
            }
          });
        }

        setNotifications(data);
        setUnreadCount(currentUnread.length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    setShowNotifications(false);
    if (notif.is_read === 0) {
      try {
        await fetch(`/api/notifications/${notif.notification_id}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchNotifications();
      } catch (err) {
        console.error(err);
      }
    }
    if (notif.target_url) {
      navigate(notif.target_url);
    }
  };

  const handleReadAllNotifications = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (path) => {
    if (path === '/app/church') return location.pathname === '/app/church';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden" style={{ '--church-primary': churchProfile.primary_color }}>
      {/* 1. 상단 동적 로고 및 개별 브랜딩 헤더 (TEAM B) */}
      <header className="glass flex items-center justify-between px-4 py-2 z-10 shrink-0">
        <div className="flex items-center gap-2">
          {/* 교회 로고 이미지 적용 */}
          <div className="h-10 flex items-center justify-center p-0.5 rounded bg-white border border-slate-700/30">
            <img 
              src={churchProfile.logo_url} 
              alt={churchProfile.church_name} 
              className="h-full w-auto object-contain max-w-[110px] xs:max-w-[130px] md:max-w-[160px]" 
            />
          </div>
          <div className="border-l border-slate-800 pl-2 leading-none flex items-center gap-2">
            <div>
              <h1 className="text-[9px] font-bold text-slate-400 tracking-tight">Church Think | {churchProfile.church_name}</h1>
              <select
                value={location.pathname.startsWith('/app/stock') ? 'stock' : location.pathname.startsWith('/app/estate') ? 'estate' : location.pathname.startsWith('/app/mission') ? 'mission' : 'church'}
                onChange={(e) => {
                  const selectedApp = e.target.value;
                  if (selectedApp === 'church') navigate('/app/church');
                  else navigate(`/app/${selectedApp}`);
                }}
                className="bg-slate-900 border border-slate-800 text-[8px] font-bold text-church-400 rounded px-1.5 py-0.5 mt-0.5 focus:outline-none cursor-pointer"
              >
                <option value="church">⛪ Church Think</option>
                <option value="stock">📈 Stock Think</option>
                <option value="estate">🏠 Estate Think</option>
                <option value="mission">🌐 Mission Think</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 글자 크기 조절 버튼 */}
          <button
            onClick={() => {
              const levels = ['normal', 'large', 'xlarge'];
              const nextIdx = (levels.indexOf(fontScale) + 1) % levels.length;
              setFontScale(levels[nextIdx]);
            }}
            className="text-slate-400 hover:text-white p-1.5 flex items-center justify-center focus:outline-none"
            title="글자 크기 변경"
          >
            <span className="text-[10px] font-extrabold border border-slate-700 hover:border-slate-500 px-1.5 py-0.5 rounded bg-slate-900/60 font-mono tracking-tighter select-none">
              가{fontScale === 'normal' ? '' : fontScale === 'large' ? '+' : '++'}
            </span>
          </button>

          {/* 알림 종 위젯 추가 */}
          <div className="relative flex items-center">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-slate-400 hover:text-white p-1.5 relative focus:outline-none"
              title="실시간 알림"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 rounded-full text-[8px] font-bold flex items-center justify-center text-white scale-90 border border-slate-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* 알림 팝오버 리스트 */}
            {showNotifications && (
              <div className="absolute right-0 top-8 w-60 glass rounded-xl border border-slate-800/80 shadow-2xl p-2.5 z-50 max-h-[300px] overflow-y-auto no-scrollbar space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60 text-[9px] font-bold text-slate-400">
                  <span>알림 리스트 ({unreadCount})</span>
                  {unreadCount > 0 && (
                    <button onClick={handleReadAllNotifications} className="text-church-400 hover:underline">
                      모두 읽음
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  {notifications.length === 0 ? (
                    <p className="text-[9px] text-slate-500 text-center py-4">새로운 알림이 없습니다.</p>
                  ) : (
                    notifications.map(n => {
                      const isCancelled = n.status === 'CANCELLED';
                      return (
                        <div
                          key={n.notification_id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-2 rounded-lg text-left cursor-pointer transition-all border text-[9px] leading-relaxed ${
                            isCancelled
                              ? 'bg-slate-950/40 border-slate-900/20 text-slate-500 line-through select-none'
                              : n.is_read === 0 
                                ? 'bg-church-600/10 border-church-500/20 hover:bg-church-600/20 text-white font-semibold' 
                                : 'bg-slate-900/30 border-slate-900/40 hover:bg-slate-900/60 text-slate-400'
                          }`}
                        >
                          <p>{isCancelled ? `[회수됨] 회수된 결재입니다.` : n.message}</p>
                          <span className="text-[7px] text-slate-500 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-slate-900/60 py-1 px-2.5 rounded-full border border-slate-800 text-[10px]">
            <User size={10} className="text-church-400" />
            <span className="font-semibold">{user?.name}</span>
            <span className="text-[8px] text-slate-400 font-medium">({user?.position})</span>
          </div>

          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="hidden md:block text-slate-400 hover:text-rose-400 transition-colors p-1"
            title="로그아웃"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* 2. 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-6">
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

          {/* Premium Placeholders (TEAM E) */}
          <Route path="/app/stock" element={<PremiumPlaceholder appId="stock" />} />
          <Route path="/app/estate" element={<PremiumPlaceholder appId="estate" />} />
          <Route path="/app/mission" element={<PremiumPlaceholder appId="mission" />} />

          <Route path="*" element={<Navigate to="/app/church" replace />} />
        </Routes>
      </main>

      {/* 3. 하단 탭 네비게이션 바 */}
      <nav className="glass py-2 px-3 flex justify-around items-center shrink-0 border-t border-slate-800/80 safe-bottom">
        <Link to="/app/church" className={`flex flex-col items-center gap-1 transition-all ${isActive('/app/church') ? 'text-church-400 scale-105 font-semibold' : 'text-slate-500'}`}>
          <Home size={18} />
          <span className="text-[9px]">홈</span>
        </Link>

        <Link to="/vouchers/new" className={`flex flex-col items-center gap-1 transition-all ${isActive('/vouchers/new') ? 'text-church-400 scale-105 font-semibold' : 'text-slate-500'}`}>
          <PlusCircle size={18} />
          <span className="text-[9px]">전표등록</span>
        </Link>

        <Link to="/vouchers" className={`flex flex-col items-center gap-1 transition-all ${isActive('/vouchers') && !location.pathname.includes('new') ? 'text-church-400 scale-105 font-semibold' : 'text-slate-500'}`}>
          <FileText size={18} />
          <span className="text-[9px]">전표목록</span>
        </Link>

        <Link to="/reports" className={`flex flex-col items-center gap-1 transition-all ${isActive('/reports') ? 'text-church-400 scale-105 font-semibold' : 'text-slate-500'}`}>
          <BarChart2 size={18} />
          <span className="text-[9px]">장부/결산</span>
        </Link>

        {(user?.role === 'AUDITOR' || user?.role === 'SYSTEM_ADMIN') && (
          <Link to="/audit" className={`flex flex-col items-center gap-1 transition-all ${isActive('/audit') ? 'text-church-400 scale-105 font-semibold' : 'text-slate-500'}`}>
            <CheckSquare size={18} />
            <span className="text-[9px]">감사위원</span>
          </Link>
        )}

        <Link to="/settings" className={`flex flex-col items-center gap-1 transition-all ${isActive('/settings') ? 'text-church-400 scale-105 font-semibold' : 'text-slate-500'}`}>
          <SettingsIcon size={18} />
          <span className="text-[9px]">설정</span>
        </Link>
      </nav>
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
          <Route path="/" element={<Portal />} />
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
