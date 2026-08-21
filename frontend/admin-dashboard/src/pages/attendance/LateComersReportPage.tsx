import { useState } from "react";
import { Table, Column, formatDate } from "@punchcloud/shared";
import { useLateComers } from "../../features/attendance/useLateComers";

interface Row {
  attendanceId: string;
  attendanceDate: string;
  lateMinutes: number;
  employee: { employeeId: number; name: string; employeeCode: string };
}

export function LateComersReportPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data, isLoading } = useLateComers(month, year);
  const rows = (data ?? []) as unknown as Row[];

  const columns: Column<Row>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.attendanceDate) },
    { key: "code", header: "Employee", render: (r) => `${r.employee?.employeeCode} — ${r.employee?.name}` },
    { key: "late", header: "Late (min)", render: (r) => r.lateMinutes },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Late-Comer Report</h1>
      <div className="mb-4 flex gap-2">
        <input type="number" value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))} className="w-20 rounded-md border border-gray-300 px-3 py-1.5 text-sm" placeholder="Month" />
        <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm" placeholder="Year" />
      </div>
      {isLoading ? <p className="text-gray-500">Loading...</p> : <Table columns={columns} rows={rows} />}
    </div>
  );
}
