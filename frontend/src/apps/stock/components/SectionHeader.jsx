export function SectionHeader({ title, description }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-extrabold text-slate-900 mb-1">{title}</h2>
      {description && <p className="text-xs text-slate-500">{description}</p>}
    </div>
  );
}
