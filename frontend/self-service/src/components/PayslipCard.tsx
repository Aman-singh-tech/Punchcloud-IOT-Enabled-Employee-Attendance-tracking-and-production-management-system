import { Link } from "react-router-dom";
import { PayrollRecord, formatCurrency, formatMonthYear } from "@punchcloud/shared";
import { Wallet, ChevronRight } from "lucide-react";
import { StatusBadge } from "./ui/StatusBadge";

export function PayslipCard({ record }: { record: PayrollRecord }) {
  return (
    <Link
      to={`/payslips/${record.month}/${record.year}`}
      className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
          <Wallet className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <div className="font-semibold text-slate-800">{formatMonthYear(record.month, record.year)}</div>
          <div className="text-sm text-slate-400">{formatCurrency(Number(record.netPay))}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={record.status} />
        <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
