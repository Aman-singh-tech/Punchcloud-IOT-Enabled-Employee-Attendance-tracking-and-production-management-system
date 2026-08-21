import { useState } from "react";
import { Table, DateRangePicker, StatusBadge, Column, formatDate, formatTime, AttendanceDaily } from "@punchcloud/shared";
import { useEmployees } from "../../features/employees/useEmployees";
import { useAttendanceHistory } from "../../features/attendance/useAttendanceReport";

export function AttendanceReportPage() {
  const { data: employees } = useEmployees();
  const [employeeId, setEmployeeId] = useState<number | undefined>();
  const [range, setRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const { data, isLoading } = useAttendanceHistory(employeeId ?? 0, range.from, range.to);

  const columns: Column<AttendanceDaily>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.attendanceDate) },
    { key: "in", header: "First In", render: (r) => formatTime(r.firstIn) },
    { key: "out", header: "Last Out", render: (r) => formatTime(r.lastOut) },
    { key: "late", header: "Late (min)", render: (r) => r.lateMinutes },
    { key: "ot", header: "OT (min)", render: (r) => r.otMinutes },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Attendance Report</h1>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={employeeId ?? ""}
          onChange={(e) => setEmployeeId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Select employee...</option>
          {(employees ?? []).map((e) => (
            <option key={e.employeeId} value={e.employeeId}>
              {e.employeeCode} — {e.name}
            </option>
          ))}
        </select>
        <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
      </div>
      {!employeeId ? (
        <p className="text-gray-500">Select an employee to view their attendance history.</p>
      ) : isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <Table columns={columns} rows={data ?? []} />
      )}
    </div>
  );
}
