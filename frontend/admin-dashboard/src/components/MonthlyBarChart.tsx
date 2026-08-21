interface Bar {
  label: string;
  value: number;
  /** Optional second, smaller value drawn inside the same bar (e.g. rejected within produced). */
  subValue?: number;
}

// Hand-rolled so the app keeps zero charting dependencies, matching RejectionRateChart.
// Bars are drawn as flex columns with a percentage height against the largest value in the
// set — a single shared scale, so month-to-month heights are actually comparable.
export function MonthlyBarChart({
  title,
  bars,
  format,
  accent = "blue",
  subLabel,
  emptyMessage = "No data for this period yet",
}: {
  title: string;
  bars: Bar[];
  format: (v: number) => string;
  accent?: "blue" | "green";
  subLabel?: string;
  emptyMessage?: string;
}) {
  const max = Math.max(...bars.map((b) => b.value), 0);
  const hasData = max > 0;

  const barColor = accent === "green" ? "bg-emerald-500" : "bg-blue-500";
  const subColor = accent === "green" ? "bg-emerald-700" : "bg-blue-700";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {subLabel && <span className="text-xs text-gray-500">{subLabel}</span>}
      </div>

      {!hasData ? (
        <p className="py-10 text-center text-sm text-gray-400">{emptyMessage}</p>
      ) : (
        <div className="mt-4 flex h-48 items-stretch gap-2">
          {bars.map((bar) => {
            const pct = (bar.value / max) * 100;
            const subPct = bar.subValue ? (bar.subValue / max) * 100 : 0;
            return (
              <div key={bar.label} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[11px] font-medium tabular-nums text-gray-600">
                  {bar.value > 0 ? format(bar.value) : ""}
                </span>
                <div
                  className="relative flex w-full flex-1 items-end"
                  title={`${bar.label}: ${format(bar.value)}`}
                >
                  <div
                    className={`w-full rounded-t ${barColor} transition-all`}
                    style={{ height: `${Math.max(pct, bar.value > 0 ? 2 : 0)}%` }}
                  >
                    {subPct > 0 && (
                      <div
                        className={`absolute bottom-0 w-full rounded-t ${subColor}`}
                        style={{ height: `${subPct}%` }}
                        title={`Rejected: ${format(bar.subValue!)}`}
                      />
                    )}
                  </div>
                </div>
                <span className="whitespace-nowrap text-[11px] text-gray-500">{bar.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
