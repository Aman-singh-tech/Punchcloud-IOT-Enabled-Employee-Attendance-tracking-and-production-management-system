import { useState } from "react";
import { apiClient, Button, useToast } from "@punchcloud/shared";

export function DisbursementFilePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  async function download() {
    setDownloading(true);
    try {
      const res = await apiClient.get("/payroll/disbursement-file", {
        params: { month, year },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `disbursement-${year}-${month}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.show("Failed to generate disbursement file — only finalized payroll records are included", "error");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-xl font-bold">Disbursement File (NEFT/RTGS Export)</h1>
      <p className="mb-4 text-sm text-gray-500">
        Exports a bank-compatible CSV of net pay for every finalized payroll record in the
        selected month. File export only — no live bank payment integration, per scope.
      </p>
      <div className="flex items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Month</label>
          <input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))} className="w-20 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Year</label>
          <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
        </div>
        <Button onClick={download} disabled={downloading}>
          {downloading ? "Preparing..." : "Download CSV"}
        </Button>
      </div>
    </div>
  );
}
