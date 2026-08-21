const STYLES: Record<string, string> = {
  Present: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Half-day": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Absent: "bg-rose-50 text-rose-700 ring-rose-600/20",
  "On Leave": "bg-sky-50 text-sky-700 ring-sky-600/20",
  Off: "bg-violet-50 text-violet-700 ring-violet-600/20",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
  finalized: "bg-sky-50 text-sky-700 ring-sky-600/20",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export function StatusBadge({ status }: { status: string }) {
  const classes = STYLES[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${classes}`}
    >
      {status}
    </span>
  );
}
