import { Search } from 'lucide-react';

export default function StockSearchBar({ value, onChange, onSearch, placeholder = "종목명 또는 종목코드를 입력하세요" }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
      />
      <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
    </form>
  );
}
