import { NavLink } from 'react-router-dom';
import { navConfig } from '../stockNavConfig';
import { TrendingUp, BarChart2, MessageSquare, User } from 'lucide-react';

const iconMap = {
  '/stock': TrendingUp,
  '/stock/korea': BarChart2,
  '/stock/stocks': BarChart2, // You can use same or different
  '/stock/community': MessageSquare,
  '/stock/my': User,
};

export function StockMobileNav() {
  const mobileNavs = navConfig.filter(item => item.mobile);
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-[#0B0F19]/95 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-around px-2 pb-safe z-50">
      {mobileNavs.map((item) => {
        const Icon = iconMap[item.path] || TrendingUp;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/stock'}
            className={() => `
              flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors
              \${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}
            `}
          >
            <Icon size={20} strokeWidth={2.5} />
            <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
}