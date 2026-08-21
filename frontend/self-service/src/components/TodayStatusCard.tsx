import { formatTime, AttendanceDaily } from "@punchcloud/shared";
import { LogIn, LogOut, Clock } from "lucide-react";
import { Card } from "./ui/Card";
import { StatusBadge } from "./ui/StatusBadge";

export function TodayStatusCard({ today }: { today: AttendanceDaily | undefined }) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Today</p>
        {today && <StatusBadge status={today.status} />}
      </div>
      {!today ? (
        <div className="flex items-center gap-3 py-2 text-slate-400">
          <Clock className="h-8 w-8 text-slate-200" strokeWidth={1.5} />
          <p className="text-sm">No punch recorded yet today.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50/60 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <LogIn className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">In</p>
              <p className="text-sm font-bold text-slate-800">{formatTime(today.firstIn)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200/70 text-slate-500">
              <LogOut className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Out</p>
              <p className="text-sm font-bold text-slate-800">{formatTime(today.lastOut)}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
