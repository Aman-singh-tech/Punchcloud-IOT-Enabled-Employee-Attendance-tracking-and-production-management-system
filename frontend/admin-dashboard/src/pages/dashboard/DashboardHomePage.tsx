import { Link } from "react-router-dom";
import { formatCurrency } from "@punchcloud/shared";
import { MonthlyBarChart } from "../../components/MonthlyBarChart";
import { useDashboardSummary } from "../../features/dashboard/useDashboardSummary";

// The dashboard leads with company-level monthly trends. It deliberately does NOT repeat the
// employee list — that lives on the Employees page, and duplicating it here was the client's
// complaint about the original screen.
export function DashboardHomePage() {
  const { data, isLoading, isError } = useDashboardSummary(6);

  if (isLoading) return <p className="text-gray-500">Loading dashboard...</p>;
  if (isError || !data) return <p className="text-red-600">Could not load the dashboard.</p>;

  const { today, activeEmployees, months } = data;
  const thisMonth = months[months.length - 1];
  const prevMonth = months.length > 1 ? months[months.length - 2] : undefined;

  const productionChange = pctChange(thisMonth?.totalAccepted, prevMonth?.totalAccepted);
  const payrollChange = pctChange(thisMonth?.totalNetPay, prevMonth?.totalNetPay);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Company Overview</h1>
        <p className="text-sm text-gray-500">
          Last 6 months · updates automatically every 30 seconds
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Accepted pieces — ${thisMonth?.label ?? "this month"}`}
          value={thisMonth ? thisMonth.totalAccepted.toLocaleString("en-IN") : "0"}
          change={productionChange}
          hint={thisMonth ? `${thisMonth.totalProduced.toLocaleString("en-IN")} produced` : undefined}
        />
        <StatCard
          label={`Salary cost — ${thisMonth?.label ?? "this month"}`}
          value={thisMonth ? formatCurrency(thisMonth.totalNetPay) : formatCurrency(0)}
          change={payrollChange}
          hint={
            thisMonth?.payrollRecordCount
              ? `${thisMonth.payrollRecordCount} payslips${thisMonth.payrollFinalized ? " · finalized" : " · draft"}`
              : "Payroll not generated yet"
          }
        />
        <StatCard
          label="Rejection rate"
          value={thisMonth ? `${thisMonth.rejectionRate.toFixed(1)}%` : "0%"}
          hint={thisMonth ? `${thisMonth.totalRejected.toLocaleString("en-IN")} rejected` : undefined}
        />
        <StatCard label="Active employees" value={String(activeEmployees)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyBarChart
          title="Monthly production"
          subLabel="Accepted pieces (dark = rejected)"
          accent="blue"
          bars={months.map((m) => ({
            label: m.label,
            value: m.totalProduced,
            subValue: m.totalRejected,
          }))}
          format={(v) => v.toLocaleString("en-IN")}
          emptyMessage="No production recorded in the last 6 months"
        />
        <MonthlyBarChart
          title="Monthly salary cost"
          subLabel="Total net pay"
          accent="green"
          bars={months.map((m) => ({ label: m.label, value: m.totalNetPay }))}
          format={(v) => `₹${Math.round(v).toLocaleString("en-IN")}`}
          emptyMessage="No payroll generated in the last 6 months"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Today</h2>
          <Link to="/attendance" className="text-xs font-medium text-blue-600 hover:underline">
            Full attendance →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <TodayStat label="Present" value={today.present} tone="green" />
          <TodayStat label="Half-day" value={today.halfDay} tone="amber" />
          <TodayStat label="Absent" value={today.absent} tone="red" />
          <TodayStat label="On Leave" value={today.onLeave} tone="blue" />
          <TodayStat label="Off" value={today.off} tone="gray" />
          <TodayStat label="Not punched yet" value={today.awaiting} tone="gray" />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-800">Month by month</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-4 text-left font-medium">Month</th>
                <th className="py-2 pr-4 text-right font-medium">Produced</th>
                <th className="py-2 pr-4 text-right font-medium">Accepted</th>
                <th className="py-2 pr-4 text-right font-medium">Rejection</th>
                <th className="py-2 text-right font-medium">Salary cost</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.label} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-4 font-medium">{m.label}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {m.totalProduced.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {m.totalAccepted.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {m.totalProduced > 0 ? `${m.rejectionRate.toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {m.totalNetPay > 0 ? formatCurrency(m.totalNetPay) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Percentage change vs the previous month; undefined when there's no meaningful baseline. */
function pctChange(current?: number, previous?: number): number | undefined {
  if (current === undefined || previous === undefined || previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
}

function StatCard({
  label,
  value,
  change,
  hint,
}: {
  label: string;
  value: string;
  change?: number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {change !== undefined && (
          <span className={change >= 0 ? "font-medium text-emerald-600" : "font-medium text-red-600"}>
            {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}% vs last month
          </span>
        )}
        {hint && <span className="text-gray-400">{hint}</span>}
      </div>
    </div>
  );
}

const TONES: Record<string, string> = {
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-blue-50 text-blue-700",
  gray: "bg-gray-50 text-gray-600",
};

function TodayStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-md px-3 py-2 ${TONES[tone]}`}>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}
