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
        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
      />
      <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
    </form>
  );
}
