
export default function GlossaryTermList({ terms }) {
  return (
    <div className="flex flex-col gap-4">
      {terms.map((term, index) => (
        <div key={index} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-base">{term.term}</h3>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded font-semibold">{term.category}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{term.definition}</p>
        </div>
      ))}
    </div>
  );
}
