const COLORS: Record<string, string> = {
  Present: "bg-green-100 text-green-800",
  "Half-day": "bg-yellow-100 text-yellow-800",
  Absent: "bg-red-100 text-red-800",
  "On Leave": "bg-blue-100 text-blue-800",
  Off: "bg-purple-100 text-purple-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  draft: "bg-gray-100 text-gray-800",
  finalized: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
};

export function StatusBadge({ status }: { status: string }) {
  const classes = COLORS[status] ?? "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}
