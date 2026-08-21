import { Link } from "react-router-dom";
import { formatDate, LeaveRequest } from "@punchcloud/shared";
import { CalendarCheck, Plus } from "lucide-react";
import { useMyLeaveRequests } from "../../features/leave/useLeaveApplication";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ListSkeleton } from "../../components/ui/Skeleton";

export function MyLeaveRequestsPage() {
  const { data, isLoading } = useMyLeaveRequests();

  const columns: Column<LeaveRequest>[] = [
    { key: "type", header: "Type", render: (r) => r.leaveType?.name ?? "-" },
    { key: "from", header: "From", render: (r) => formatDate(r.fromDate) },
    { key: "to", header: "To", render: (r) => formatDate(r.toDate) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="animate-in space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-slate-900">My Leave Requests</h1>
        </div>
        <Link
          to="/leave/apply"
          className="flex items-center gap-1 rounded-full bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <Plus className="h-3.5 w-3.5" /> Apply
        </Link>
      </div>
      {isLoading ? <ListSkeleton rows={3} /> : <Table columns={columns} rows={data ?? []} emptyMessage="No leave requests yet" />}
    </div>
  );
}
