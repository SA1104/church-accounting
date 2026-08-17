import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from "../../../App";
import { StockServiceHeader } from '../components/StockServiceHeader';
import { StockDesktopNav } from '../components/StockDesktopNav';
import { StockMobileNav } from '../components/StockMobileNav';

export function StockLayout() {
  const { token } = useAuth();
  const location = useLocation();
  
  // 보호된 라우트 (내 투자 등)
  const isProtectedRoute = location.pathname.startsWith('/stock/my');

  if (isProtectedRoute && !token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-pretendard flex flex-col">
      <StockServiceHeader />
      <StockDesktopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 pb-24 md:pb-10 overflow-x-hidden">
        <Outlet />
      </main>
      <StockMobileNav />
    </div>
  );
}
