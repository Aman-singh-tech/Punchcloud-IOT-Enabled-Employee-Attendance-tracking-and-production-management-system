import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { payrollApi, Table, Button, StatusBadge, Column, formatCurrency, PayrollRecord, useAuth } from "@punchcloud/shared";
import { useFinalizePayroll } from "../../features/payroll/usePayslip";

interface Row extends PayrollRecord {
  employee?: { employeeId: number; name: string; employeeCode: string };
}

export function PayrollRecordListPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["payroll", "period", month, year],
    queryFn: () => payrollApi.listByPeriod(month, year),
  });
  const finalize = useFinalizePayroll();
  const rows = (data ?? []) as unknown as Row[];

  const columns: Column<Row>[] = [
    { key: "employee", header: "Employee", render: (r) => (
      <Link to={`/payroll/${r.employeeId}/${r.month}/${r.year}`} className="text-primary hover:underline">
        {r.employee?.employeeCode} — {r.employee?.name}
      </Link>
    ) },
    { key: "type", header: "Type", render: (r) => (r.employeeType === "piece_rate" ? "Piece-Rate" : "Fixed-Salary") },
    { key: "netPay", header: "Net Pay", render: (r) => formatCurrency(Number(r.netPay)) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: "", render: (r) => (
      r.status === "draft" && user?.role === "HR" ? (
        <Button variant="secondary" onClick={() => finalize.mutate(r.payrollId)} disabled={finalize.isPending}>
          Finalize
        </Button>
      ) : null
    ) },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Payroll Records</h1>
      <div className="mb-4 flex gap-2">
        <input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))} className="w-20 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
        <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
      </div>
      {isLoading ? <p className="text-gray-500">Loading...</p> : <Table columns={columns} rows={rows} />}
    </div>
  );
}
