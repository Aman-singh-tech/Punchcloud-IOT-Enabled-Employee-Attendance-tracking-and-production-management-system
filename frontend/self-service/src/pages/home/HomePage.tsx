import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth, employeeApi, AttendanceDaily } from "@punchcloud/shared";
import { CalendarPlus, ChevronRight } from "lucide-react";
import { useMyAttendance } from "../../features/attendance/useMyAttendance";
import { useMyProduction } from "../../features/production/useMyProduction";
import { TodayStatusCard } from "../../components/TodayStatusCard";
import { ProductionSummaryCard } from "../../components/ProductionSummaryCard";
import { CardSkeleton } from "../../components/ui/Skeleton";

export function HomePage() {
  const { user } = useAuth();
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: history, isLoading: attendanceLoading } = useMyAttendance(todayStr, todayStr);
  const { data: employee } = useQuery({
    queryKey: ["myEmployee", user?.employeeId],
    queryFn: () => employeeApi.get(user!.employeeId!),
    enabled: !!user?.employeeId,
  });
  const isPieceRate = employee?.salaryStructures?.some((s) => s.employeeType === "piece_rate" && !s.effectiveTo);
  const monthStart = new Date(new Date().setDate(1)).toISOString().slice(0, 10);
  const { data: production } = useMyProduction(monthStart, todayStr);

  const today = (history ?? [])[0] as AttendanceDaily | undefined;
  const firstName = (user?.employeeName ?? user?.email ?? "").split(" ")[0];

  return (
    <div className="animate-in space-y-4">
      <div>
        <p className="text-sm text-slate-400">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Hi, {firstName} 👋</h1>
      </div>

      {attendanceLoading ? <CardSkeleton /> : <TodayStatusCard today={today} />}

      {isPieceRate && <ProductionSummaryCard entries={production ?? []} />}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick actions</p>
        <Link
          to="/leave/apply"
          className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
            <CalendarPlus className="h-5 w-5" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">Apply for Leave</span>
            <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
