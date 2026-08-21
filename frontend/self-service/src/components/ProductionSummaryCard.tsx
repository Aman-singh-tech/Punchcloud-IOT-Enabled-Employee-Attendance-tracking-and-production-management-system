import { ProductionEntry } from "@punchcloud/shared";
import { Layers, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "./ui/Card";

// Only rendered by callers when employee.employeeType === 'piece_rate' (frontend doc
// Section 5) — a fixed-salary employee never sees this card.
export function ProductionSummaryCard({ entries }: { entries: ProductionEntry[] }) {
  const totals = entries.reduce(
    (acc, e) => ({
      produced: acc.produced + e.recordsProduced,
      accepted: acc.accepted + e.recordsAccepted,
      rejected: acc.rejected + e.recordsRejected,
    }),
    { produced: 0, accepted: 0, rejected: 0 },
  );

  const stats = [
    { label: "Produced", value: totals.produced, icon: Layers, color: "text-slate-500", bg: "bg-slate-100" },
    { label: "Accepted", value: totals.accepted, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Rejected", value: totals.rejected, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <Card>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">This period</p>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className={`flex flex-col items-center gap-1.5 rounded-xl ${s.bg} py-3`}>
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <span className="text-lg font-bold text-slate-800">{s.value}</span>
            <span className="text-[11px] font-medium text-slate-400">{s.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
