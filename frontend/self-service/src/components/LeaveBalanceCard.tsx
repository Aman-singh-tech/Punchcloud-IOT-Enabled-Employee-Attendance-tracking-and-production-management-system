import { LeaveBalance } from "@punchcloud/shared";
import { Card } from "./ui/Card";

const RING_COLORS = ["text-primary", "text-emerald-500", "text-amber-500", "text-sky-500", "text-violet-500"];

// `allotted` is never populated anywhere in the system (no HR UI or job sets an annual leave
// quota per employee — it's created at 0 and only ever read, never written to a real value).
// The card used to show "remaining = allotted - used", which was always negative the moment
// anyone took a single day of leave (0 - 1 = -1) — found live 2026-08-21. Until a real quota
// feature exists, "days used" is the only number this data can honestly show.
export function LeaveBalanceCard({ balances }: { balances: LeaveBalance[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {balances.map((b, i) => (
        <Card key={b.leaveTypeId} className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500">{b.leaveType?.name}</p>
          <div>
            <span className={`text-2xl font-bold ${RING_COLORS[i % RING_COLORS.length]}`}>
              {Number(b.used)}
            </span>
            <span className="ml-1 text-xs text-slate-400">day{Number(b.used) === 1 ? "" : "s"} used</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
