
export default function StockFilterBar({ filters, activeFilter, onFilterChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {filters.map(filter => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeFilter === filter.value ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
