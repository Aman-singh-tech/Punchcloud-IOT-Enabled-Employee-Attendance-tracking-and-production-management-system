import { useState } from "react";
import { Table, DateRangePicker, Column, Employee } from "@punchcloud/shared";
import { useProductionReport } from "../../features/production/useProductionReport";
import { useEmployees } from "../../features/employees/useEmployees";
import { RejectionRateChart } from "../../components/RejectionRateChart";

interface EntryRow {
  entryId: string;
  entryDate: string;
  recordsProduced: number;
  recordsAccepted: number;
  recordsRejected: number;
  employee: { employeeCode: string; name: string };
}

export function ProductionReportPage() {
  const [range, setRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [employeeId, setEmployeeId] = useState<number | undefined>(undefined);

  const { data: employees } = useEmployees() as { data: Employee[] | undefined };
  const { data, isLoading } = useProductionReport(undefined, range.from, range.to, employeeId);
  const report = data as { totalProduced: number; totalAccepted: number; totalRejected: number; rejectionRate: number; entries: EntryRow[] } | undefined;

  const columns: Column<EntryRow>[] = [
    { key: "date", header: "Date", render: (r) => r.entryDate.slice(0, 10) },
    { key: "employee", header: "Employee", render: (r) => `${r.employee?.employeeCode} — ${r.employee?.name}` },
    { key: "produced", header: "Produced", render: (r) => r.recordsProduced },
    { key: "accepted", header: "Accepted", render: (r) => r.recordsAccepted },
    { key: "rejected", header: "Rejected", render: (r) => r.recordsRejected },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Production Report</h1>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Employee</label>
          <select
            value={employeeId ?? ""}
            onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All Employees</option>
            {(employees ?? []).map((emp) => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.employeeCode} — {emp.name}
              </option>
            ))}
          </select>
        </div>
        <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
      </div>
      {isLoading || !report ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="mb-4">
            <RejectionRateChart totalAccepted={report.totalAccepted} totalRejected={report.totalRejected} rejectionRate={report.rejectionRate} />
          </div>
          <Table
            columns={columns}
            rows={report.entries}
            emptyMessage={employeeId ? "No production entries for this employee in this range" : "No production entries in this range"}
          />
        </>
      )}
    </div>
  );
}
