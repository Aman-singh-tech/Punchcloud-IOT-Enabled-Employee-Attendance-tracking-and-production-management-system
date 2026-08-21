interface GenerationResult {
  employeeId: number;
  ok: boolean;
  payrollId?: string;
  error?: string;
}

export function PayrollRunSummaryCard({ results }: { results: GenerationResult[] }) {
  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 flex gap-6 text-sm">
        <span className="text-green-700">{ok.length} generated</span>
        <span className="text-red-700">{failed.length} failed</span>
      </div>
      {failed.length > 0 && (
        <ul className="space-y-1 text-xs text-red-600">
          {failed.map((f) => (
            <li key={f.employeeId}>
              Employee #{f.employeeId}: {f.error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
