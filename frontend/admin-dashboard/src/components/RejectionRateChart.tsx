export function RejectionRateChart({
  totalAccepted,
  totalRejected,
  rejectionRate,
}: {
  totalAccepted: number;
  totalRejected: number;
  rejectionRate: number;
}) {
  const total = totalAccepted + totalRejected || 1;
  const acceptedPct = (totalAccepted / total) * 100;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">Accepted vs Rejected</span>
        <span className="text-gray-500">Rejection rate: {rejectionRate.toFixed(1)}%</span>
      </div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="bg-green-500" style={{ width: `${acceptedPct}%` }} />
        <div className="bg-red-500" style={{ width: `${100 - acceptedPct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>Accepted: {totalAccepted}</span>
        <span>Rejected: {totalRejected}</span>
      </div>
    </div>
  );
}
