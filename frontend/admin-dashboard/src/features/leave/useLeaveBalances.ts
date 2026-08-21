import { useQuery } from "@tanstack/react-query";
import { leaveApi } from "@punchcloud/shared";

export function useLeaveBalances(employeeId?: number) {
  return useQuery({
    queryKey: ["leave", "balance", employeeId],
    queryFn: () => leaveApi.getBalance(employeeId!),
    enabled: !!employeeId,
  });
}
