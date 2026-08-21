import { useQuery } from "@tanstack/react-query";
import { leaveApi, useAuth } from "@punchcloud/shared";

export function useMyLeaveBalance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["myLeaveBalance", user?.employeeId],
    queryFn: () => leaveApi.getBalance(user!.employeeId!),
    enabled: !!user?.employeeId,
  });
}
