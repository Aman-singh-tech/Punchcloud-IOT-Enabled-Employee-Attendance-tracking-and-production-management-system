import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { correctionApi, Table, Button, StatusBadge, Column, formatDate, useToast } from "@punchcloud/shared";
import type { CorrectionRequest } from "@punchcloud/shared";

export function AttendanceCorrectionQueuePage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["corrections", "pending"],
    queryFn: () => correctionApi.list("pending"),
  });

  const resolve = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "approved" | "rejected" }) =>
      correctionApi.resolve(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corrections"] });
      toast.show("Correction resolved", "success");
    },
  });

  const columns: Column<CorrectionRequest>[] = [
    { key: "date", header: "Target Date", render: (r) => formatDate(r.targetDate) },
    { key: "type", header: "Type", render: (r) => r.requestType.replace("_", " ") },
    { key: "desc", header: "Description", render: (r) => r.description ?? "-" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => resolve.mutate({ id: r.requestId, status: "approved" })}>
            Approve
          </Button>
          <Button variant="danger" onClick={() => resolve.mutate({ id: r.requestId, status: "rejected" })}>
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Correction & Dispute Queue</h1>
      <p className="mb-4 text-sm text-gray-500">
        Approving a missed-punch/attendance correction here applies a placeholder status
        adjustment; use the API with a corrected payload for full attendance/production
        overrides. Corrections never silently overwrite raw data — every change is audit-logged.
      </p>
      {isLoading ? <p className="text-gray-500">Loading...</p> : <Table columns={columns} rows={data ?? []} emptyMessage="No pending requests" />}
    </div>
  );
}
