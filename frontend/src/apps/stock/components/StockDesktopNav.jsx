import { NavLink } from 'react-router-dom';
import { navConfig } from '../stockNavConfig';

export function StockDesktopNav() {
  return (
    <div className="hidden md:block border-b border-slate-200 bg-white sticky top-16 z-30">
      <nav className="flex gap-8 h-12 items-center px-4 md:px-8 max-w-7xl mx-auto">
        {navConfig.map(item => (
          <NavLink 
            key={item.path} 
            to={item.path}
            end={item.path === '/stock'}
            className={({ isActive }) => `text-[13px] font-bold transition-colors ${isActive ? 'text-indigo-600 border-b-2 border-indigo-600 h-full flex items-center' : 'text-slate-500 hover:text-slate-800 h-full flex items-center'}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
