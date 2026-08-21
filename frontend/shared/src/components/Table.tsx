import { ReactNode } from "react";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  key: string;
}

export function Table<T>({ columns, rows, emptyMessage = "No data" }: { columns: Column<T>[]; rows: T[]; emptyMessage?: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2 text-left font-semibold text-gray-600">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2 text-gray-700">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
