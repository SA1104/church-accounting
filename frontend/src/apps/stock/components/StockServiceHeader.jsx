import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../App";
import { LogOut } from 'lucide-react';

export function StockServiceHeader() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-6">
        {/* Booza Think Main Platform Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate('/')}
          aria-label="Booza Think Platform"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-extrabold text-sm tracking-tighter">BT</span>
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

        {/* Stock Think Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate('/stock')}
          aria-label="Stock Think Home"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm group-hover:bg-slate-800 transition-colors">
            <span className="text-white font-extrabold text-sm tracking-tighter">ST</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-900 font-extrabold text-sm tracking-tight leading-none group-hover:text-indigo-600 transition-colors">Stock Think</span>
            <span className="text-slate-500 text-[10px] font-medium tracking-wider mt-0.5">데이터 기반 투자결정</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {token ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 font-medium hidden sm:inline-block">
              <span className="text-slate-900 font-bold">{user?.name || '사용자'}</span>님
            </span>
            <button onClick={() => navigate('/stock/my')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors hidden sm:block">
              내 투자
            </button>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors" title="로그아웃" aria-label="로그아웃">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => navigate('/login')}
            className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-full transition-colors shadow-sm"
          >
            로그인
          </button>
        )}
      </div>
    </header>
  );
}
