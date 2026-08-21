import { ReactNode } from "react";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  key: string;
}

export function Table<T>({
  columns,
  rows,
  emptyMessage = "Nothing here yet",
}: {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <Card className="p-0">
        <EmptyState message={emptyMessage} />
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((row, i) => (
            <tr key={i} className="transition-colors hover:bg-slate-50/70">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-700">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
