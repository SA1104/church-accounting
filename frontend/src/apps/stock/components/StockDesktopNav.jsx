import { NavLink } from 'react-router-dom';

export function StockDesktopNav({ navItems }) {
  return (
    <nav className="hidden md:flex gap-6 h-full items-center">
      {navItems.map(item => (
        <NavLink 
          key={item.path} 
          to={item.path}
          className={({ isActive }) => `text-sm font-bold transition-colors ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
