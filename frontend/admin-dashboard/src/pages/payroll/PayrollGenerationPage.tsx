import { useState } from "react";
import { Button, useToast } from "@punchcloud/shared";
import { useGeneratePayroll } from "../../features/payroll/usePayrollGeneration";
import { PayrollRunSummaryCard } from "../../components/PayrollRunSummaryCard";

export function PayrollGenerationPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const generate = useGeneratePayroll();
  const toast = useToast();

  return (
    <div className="max-w-xl">
      <h1 className="mb-4 text-xl font-bold">Generate Monthly Payroll</h1>
      <p className="mb-4 text-sm text-gray-500">
        Runs the two confirmed pay paths for every active employee: piece-rate pay is
        output-driven only, fixed-salary pay is pro-rated by attendance. OT is never paid to
        anyone. Records are created as drafts — review before finalizing.
      </p>
      <div className="mb-4 flex items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Month</label>
          <input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))} className="w-20 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Year</label>
          <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
        </div>
        <Button
          disabled={generate.isPending}
          onClick={() =>
            generate.mutate(
              { month, year },
              { onSuccess: () => toast.show("Payroll run complete", "success") },
            )
          }
        >
          {generate.isPending ? "Generating..." : "Generate Payroll"}
        </Button>
      </div>
      {generate.data && <PayrollRunSummaryCard results={generate.data as any} />}
    </div>
  );
}
