import { LeaveBalance } from "@punchcloud/shared";
import { Card } from "./ui/Card";

const RING_COLORS = ["text-primary", "text-emerald-500", "text-amber-500", "text-sky-500", "text-violet-500"];

export function LeaveBalanceCard({ balances }: { balances: LeaveBalance[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {balances.map((b, i) => {
        const remaining = Number(b.allotted) - Number(b.used);
        const pct = Number(b.allotted) > 0 ? Math.max(0, Math.min(100, (remaining / Number(b.allotted)) * 100)) : 0;
        return (
          <Card key={b.leaveTypeId} className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500">{b.leaveType?.name}</p>
            <div className="flex items-end justify-between">
              <div>
                <span className={`text-2xl font-bold ${RING_COLORS[i % RING_COLORS.length]}`}>{remaining}</span>
                <span className="ml-1 text-xs text-slate-400">/ {b.allotted} days</span>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full bg-current ${RING_COLORS[i % RING_COLORS.length]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
