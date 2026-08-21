import { Wallet } from "lucide-react";
import { useMyPayslips } from "../../features/payslips/useMyPayslips";
import { PayslipCard } from "../../components/PayslipCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { ListSkeleton } from "../../components/ui/Skeleton";

export function MyPayslipsPage() {
  const { data, isLoading } = useMyPayslips();

  return (
    <div className="animate-in space-y-4">
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-slate-900">My Payslips</h1>
      </div>
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Wallet} message="No payslips generated yet." />
      ) : (
        <div className="space-y-2">
          {data.map((r) => (
            <PayslipCard key={`${r.month}-${r.year}`} record={r} />
          ))}
        </div>
      )}
    </div>
  );
}
