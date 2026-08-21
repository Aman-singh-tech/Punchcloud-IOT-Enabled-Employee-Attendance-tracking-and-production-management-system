export function DateRangePicker({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-card">
      <input
        type="date"
        value={from}
        onChange={(e) => onChange({ from: e.target.value, to })}
        className="rounded-lg border-0 bg-transparent px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <span className="text-xs font-medium text-slate-300">to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange({ from, to: e.target.value })}
        className="rounded-lg border-0 bg-transparent px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
