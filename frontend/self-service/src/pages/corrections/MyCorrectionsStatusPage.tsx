import { Link } from "react-router-dom";
import { formatDate, CorrectionRequest } from "@punchcloud/shared";
import { FileWarning, Plus } from "lucide-react";
import { useMyCorrections } from "../../features/corrections/useCorrectionRequest";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ListSkeleton } from "../../components/ui/Skeleton";

export function MyCorrectionsStatusPage() {
  const { data, isLoading } = useMyCorrections();

  const columns: Column<CorrectionRequest>[] = [
    { key: "date", header: "Target Date", render: (r) => formatDate(r.targetDate) },
    { key: "type", header: "Type", render: (r) => r.requestType.replace("_", " ") },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="animate-in space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileWarning className="h-5 w-5 text-amber-500" />
          <h1 className="text-xl font-bold text-slate-900">My Corrections</h1>
        </div>
        <Link
          to="/corrections/raise"
          className="flex items-center gap-1 rounded-full bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <Plus className="h-3.5 w-3.5" /> Raise
        </Link>
      </div>
      {isLoading ? <ListSkeleton rows={3} /> : <Table columns={columns} rows={data ?? []} emptyMessage="No correction requests yet" />}
    </div>
  );
}
