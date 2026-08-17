import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../App";
import { LogOut } from 'lucide-react';

export function StockServiceHeader() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-800/60 bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-40">
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => navigate('/stock')}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
          <span className="text-white font-extrabold text-sm tracking-tighter">ST</span>
        </div>
        <div className="flex flex-col">
          <span className="text-white font-extrabold text-sm tracking-tight leading-none group-hover:text-indigo-400 transition-colors">Stock Think</span>
          <span className="text-slate-400 text-[10px] font-medium tracking-wider mt-0.5">데이터 기반 투자결정</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {token ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 font-medium hidden sm:inline-block">
              <span className="text-white font-bold">{user?.name || '사용자'}</span>님
            </span>
            <button onClick={() => navigate('/stock/my')} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-full transition-colors border border-indigo-500/20 hidden sm:block">
              내 투자
            </button>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors" title="로그아웃">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => navigate('/login')}
            className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded-full transition-colors shadow-lg shadow-indigo-600/20"
          >
            로그인
          </button>
        )}
      </div>
    </header>
  );
}
