import { useState } from "react";
import { formatDate, formatTime, AttendanceDaily } from "@punchcloud/shared";
import { CalendarDays } from "lucide-react";
import { useMyAttendance } from "../../features/attendance/useMyAttendance";
import { Table, Column } from "../../components/ui/Table";
import { DateRangePicker } from "../../components/ui/DateRangePicker";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ListSkeleton } from "../../components/ui/Skeleton";

export function MyAttendancePage() {
  const [range, setRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const { data, isLoading } = useMyAttendance(range.from, range.to);

  const columns: Column<AttendanceDaily>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.attendanceDate) },
    { key: "in", header: "In", render: (r) => formatTime(r.firstIn) },
    { key: "out", header: "Out", render: (r) => formatTime(r.lastOut) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="animate-in space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-slate-900">My Attendance</h1>
      </div>
      <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
      {isLoading ? <ListSkeleton rows={4} /> : <Table columns={columns} rows={data ?? []} emptyMessage="No attendance records for this range" />}
    </div>
  );
}
