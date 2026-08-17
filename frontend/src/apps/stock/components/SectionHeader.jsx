
export function SectionHeader({ title, description }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-white mb-1">{title}</h2>
      {description && <p className="text-xs text-slate-400">{description}</p>}
    </div>
  );
}
