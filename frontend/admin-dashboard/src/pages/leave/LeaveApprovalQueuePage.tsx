import { Table, Button, StatusBadge, Column, formatDate, useToast, LeaveRequest } from "@punchcloud/shared";
import { useLeaveQueue, useUpdateLeaveStatus } from "../../features/leave/useLeaveQueue";

interface Row extends LeaveRequest {
  employee?: { employeeId: number; name: string; employeeCode: string };
}

export function LeaveApprovalQueuePage() {
  const { data, isLoading } = useLeaveQueue("pending");
  const updateStatus = useUpdateLeaveStatus();
  const toast = useToast();
  const rows = (data ?? []) as unknown as Row[];

  const columns: Column<Row>[] = [
    { key: "employee", header: "Employee", render: (r) => `${r.employee?.employeeCode} — ${r.employee?.name}` },
    { key: "type", header: "Leave Type", render: (r) => r.leaveType?.name ?? "-" },
    { key: "from", header: "From", render: (r) => formatDate(r.fromDate) },
    { key: "to", header: "To", render: (r) => formatDate(r.toDate) },
    { key: "reason", header: "Reason", render: (r) => r.reason ?? "-" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              updateStatus.mutate(
                { id: r.leaveId, status: "approved" },
                { onSuccess: () => toast.show("Leave approved", "success") },
              )
            }
          >
            Approve
          </Button>
          <Button
            variant="danger"
            onClick={() =>
              updateStatus.mutate(
                { id: r.leaveId, status: "rejected" },
                { onSuccess: () => toast.show("Leave rejected", "info") },
              )
            }
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Leave Approval Queue</h1>
      {isLoading ? <p className="text-gray-500">Loading...</p> : <Table columns={columns} rows={rows} emptyMessage="No pending leave requests" />}
    </div>
  );
}
