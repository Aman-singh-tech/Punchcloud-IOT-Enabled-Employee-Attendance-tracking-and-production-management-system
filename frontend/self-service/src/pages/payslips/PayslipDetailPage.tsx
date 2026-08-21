import { useParams } from "react-router-dom";
import { formatCurrency, formatMonthYear } from "@punchcloud/shared";
import { Download, Info } from "lucide-react";
import { useMyPayslip } from "../../features/payslips/useMyPayslips";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { ListSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";

function StatRow({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800">
        {value}
        {hint && <span className="ml-1.5 text-xs font-normal text-slate-400">{hint}</span>}
      </span>
    </div>
  );
}

export function PayslipDetailPage() {
  const { month, year } = useParams();
  const { data: payslip, isLoading } = useMyPayslip(
    month ? parseInt(month, 10) : undefined,
    year ? parseInt(year, 10) : undefined,
  );

  if (isLoading) return <ListSkeleton rows={2} />;
  if (!payslip) return <EmptyState message="No payslip found." />;

  return (
    <div className="animate-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">{formatMonthYear(payslip.month, payslip.year)}</h1>
        <StatusBadge status={payslip.status} />
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-lg shadow-primary/25">
        <p className="text-xs font-medium uppercase tracking-wide text-white/70">Net Pay</p>
        <p className="mt-1 text-3xl font-extrabold">{formatCurrency(Number(payslip.netPay))}</p>
      </div>

      <Card>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Attendance</p>
        <div className="divide-y divide-slate-50">
          <StatRow label="Days Present" value={payslip.daysPresent ?? "-"} />
          <StatRow label="Half-days" value={payslip.daysHalfDay ?? 0} hint="each counts as 0.5 day" />
          <StatRow label="Days Absent" value={payslip.daysAbsent ?? "-"} />
          <StatRow label="Late Arrivals" value={payslip.daysLate ?? 0} />
          <StatRow
            label="Days on Leave"
            value={(payslip.daysOnPaidLeave ?? 0) + (payslip.daysOnUnpaidLeave ?? 0)}
            hint="not paid"
          />
          <StatRow label="Weekly Off Days" value={payslip.daysOff ?? 0} />
          {payslip.employeeType === "fixed_salary" && (
            <StatRow label="Working Days" value={payslip.workingDays ?? "-"} />
          )}
          <StatRow label="Late Minutes" value={payslip.totalLateMinutes ?? 0} />
          <StatRow label="OT Minutes" value={payslip.totalOtMinutes ?? 0} hint="not paid" />
        </div>
      </Card>

      {payslip.employeeType === "piece_rate" && (
        <Card>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Production</p>
          <div className="divide-y divide-slate-50">
            <StatRow label="Produced" value={payslip.totalProduced ?? 0} />
            <StatRow label="Accepted" value={payslip.totalAccepted ?? 0} />
            <StatRow label="Rejected" value={payslip.totalRejected ?? 0} />
          </div>
        </Card>
      )}

      <div className="flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-xs text-sky-700">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          {payslip.employeeType === "fixed_salary"
            ? "Net pay is your salary for the days you were present. Leave and overtime are not paid. No deductions are itemized."
            : "Net pay is based only on your accepted pieces. No deductions are itemized."}
        </span>
      </div>

      {payslip.downloadUrl && (
        <a href={payslip.downloadUrl} target="_blank" rel="noreferrer">
          <Button icon={<Download className="h-4 w-4" />} className="w-full">
            Download PDF
          </Button>
        </a>
      )}
    </div>
  );
}
