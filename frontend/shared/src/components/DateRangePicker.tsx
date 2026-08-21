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
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={from}
        onChange={(e) => onChange({ from: e.target.value, to })}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
      />
      <span className="text-gray-400">to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange({ from, to: e.target.value })}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
      />
    </div>
  );
}
