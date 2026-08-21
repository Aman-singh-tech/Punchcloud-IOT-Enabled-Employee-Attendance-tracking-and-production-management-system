import { Wallet2 } from "lucide-react";
import { useMyLeaveBalance } from "../../features/leave/useMyLeaveBalance";
import { LeaveBalanceCard } from "../../components/LeaveBalanceCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { ListSkeleton } from "../../components/ui/Skeleton";

export function MyLeaveBalancePage() {
  const { data, isLoading } = useMyLeaveBalance();

  return (
    <div className="animate-in space-y-4">
      <div className="flex items-center gap-2">
        <Wallet2 className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-slate-900">Leave Balance</h1>
      </div>
      {isLoading ? (
        <ListSkeleton rows={2} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="No leave balance records yet." />
      ) : (
        <LeaveBalanceCard balances={data} />
      )}
    </div>
  );
}
