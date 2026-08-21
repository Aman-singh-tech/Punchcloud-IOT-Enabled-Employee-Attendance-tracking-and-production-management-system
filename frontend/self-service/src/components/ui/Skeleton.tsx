export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="h-6 w-32" />
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
          <Skeleton className="mb-2 h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
