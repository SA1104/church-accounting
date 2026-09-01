import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { TrendingUp, Home, Scale, PieChart, Globe, BookOpen, Menu, Search, User } from 'lucide-react';

const SERVICES = [
  { id: 'stock', name: '주식', icon: <TrendingUp size={18} />, path: '/service/stock' },
  { id: 'real_estate', name: '부동산', icon: <Home size={18} />, path: '/service/real_estate' },
  { id: 'politics', name: '정치', icon: <Scale size={18} />, path: '/service/politics' },
  { id: 'economy', name: '경제', icon: <PieChart size={18} />, path: '/service/economy' },
  { id: 'mission', name: '선교', icon: <Globe size={18} />, path: '/service/mission' },
  { id: 'word_sharing', name: '말씀 나눔', icon: <BookOpen size={18} />, path: '/service/word_sharing' },
];

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Side Navigation */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="font-black tracking-widest bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            BOOZA THINK
          </span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 text-xs font-bold text-slate-500 tracking-wider">SERVICES</div>
          <ul className="space-y-1 px-2">
            {SERVICES.map(service => (
              <li key={service.id}>
                <NavLink
                  to={service.path}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-semibold text-sm ${
                      isActive 
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                    }`
                  }
                >
                  {service.icon}
                  {service.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <User size={14} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{user?.name || '사용자'}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email || 'user@boozathink.com'}</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors">
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <button className="md:hidden p-2 text-slate-400 hover:text-white">
              <Menu size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="검색어 입력..." 
                className="bg-slate-950 border border-slate-800 rounded-full py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 w-64"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
