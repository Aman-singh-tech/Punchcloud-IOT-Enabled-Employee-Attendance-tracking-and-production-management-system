import { useParams } from "react-router-dom";
import { formatCurrency, formatMonthYear, StatusBadge, Button } from "@punchcloud/shared";
import { usePayslip } from "../../features/payroll/usePayslip";

export function PayslipDetailPage() {
  const { employeeId, month, year } = useParams();
  const { data: payslip, isLoading } = usePayslip(
    employeeId ? parseInt(employeeId, 10) : undefined,
    month ? parseInt(month, 10) : undefined,
    year ? parseInt(year, 10) : undefined,
  );

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!payslip) return <p className="text-gray-500">No payroll record found.</p>;

  return (
    <div className="max-w-lg rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Payslip — {formatMonthYear(payslip.month, payslip.year)}</h1>
        <StatusBadge status={payslip.status} />
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-gray-500">Pay Type</dt><dd>{payslip.employeeType === "piece_rate" ? "Piece-Rate" : "Fixed-Salary"}</dd></div>
        <div><dt className="text-gray-500">Days Present</dt><dd>{payslip.daysPresent ?? "-"}</dd></div>
        <div>
          <dt className="text-gray-500">Half-days</dt>
          <dd>{payslip.daysHalfDay ?? 0} <span className="text-xs text-gray-400">(each = 0.5 day)</span></dd>
        </div>
        <div><dt className="text-gray-500">Days Absent</dt><dd>{payslip.daysAbsent ?? "-"}</dd></div>
        <div>
          <dt className="text-gray-500">Late Arrivals</dt>
          <dd>{payslip.daysLate ?? 0}</dd>
        </div>
        {/* No paid leave exists here — leave days are shown for the record only. */}
        <div>
          <dt className="text-gray-500">Days on Leave</dt>
          <dd>
            {(payslip.daysOnPaidLeave ?? 0) + (payslip.daysOnUnpaidLeave ?? 0)}{" "}
            <span className="text-xs text-gray-400">(not paid)</span>
          </dd>
        </div>
        <div><dt className="text-gray-500">Weekly Off Days</dt><dd>{payslip.daysOff ?? 0}</dd></div>
        {payslip.employeeType === "fixed_salary" && (
          <div><dt className="text-gray-500">Working Days</dt><dd>{payslip.workingDays ?? "-"}</dd></div>
        )}
        <div><dt className="text-gray-500">Late Minutes</dt><dd>{payslip.totalLateMinutes ?? 0}</dd></div>
        <div>
          <dt className="text-gray-500">OT Minutes</dt>
          <dd>{payslip.totalOtMinutes ?? 0} <span className="text-xs text-gray-400">(recorded only — not paid)</span></dd>
        </div>
        {payslip.employeeType === "piece_rate" && (
          <>
            <div><dt className="text-gray-500">Produced</dt><dd>{payslip.totalProduced ?? 0}</dd></div>
            <div><dt className="text-gray-500">Accepted</dt><dd>{payslip.totalAccepted ?? 0}</dd></div>
            <div><dt className="text-gray-500">Rejected</dt><dd>{payslip.totalRejected ?? 0}</dd></div>
          </>
        )}
      </dl>

      {/* No gross-to-net breakdown: net_pay is the single final figure, no deductions exist. */}
      <div className="rounded-md bg-blue-50 p-4">
        <div className="text-sm text-gray-600">Net Pay</div>
        <div className="text-2xl font-bold text-blue-700">{formatCurrency(Number(payslip.netPay))}</div>
      </div>

      {payslip.downloadUrl && (
        <a href={payslip.downloadUrl} target="_blank" rel="noreferrer" className="mt-4 block">
          <Button className="w-full">Download PDF</Button>
        </a>
      )}
    </div>
  );
}
