import { useState } from "react";
import { formatDate, ProductionEntry } from "@punchcloud/shared";
import { Package } from "lucide-react";
import { useMyProduction } from "../../features/production/useMyProduction";
import { Table, Column } from "../../components/ui/Table";
import { DateRangePicker } from "../../components/ui/DateRangePicker";
import { ListSkeleton } from "../../components/ui/Skeleton";
import { ProductionSummaryCard } from "../../components/ProductionSummaryCard";

// Piece-rate employees only, read-only — they don't submit this themselves, the
// supervisor does (frontend doc Section 4).
export function MyProductionPage() {
  const [range, setRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const { data, isLoading } = useMyProduction(range.from, range.to);

  const columns: Column<ProductionEntry>[] = [
    { key: "date", header: "Date", render: (e) => formatDate(e.entryDate) },
    { key: "produced", header: "Produced", render: (e) => e.recordsProduced },
    { key: "accepted", header: "Accepted", render: (e) => e.recordsAccepted },
    { key: "rejected", header: "Rejected", render: (e) => e.recordsRejected },
  ];

  return (
    <div className="animate-in space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-slate-900">My Production</h1>
      </div>
      <DateRangePicker from={range.from} to={range.to} onChange={setRange} />
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          <ProductionSummaryCard entries={data ?? []} />
          <Table columns={columns} rows={data ?? []} emptyMessage="No production entries for this range" />
        </>
      )}
    </div>
  );
}
