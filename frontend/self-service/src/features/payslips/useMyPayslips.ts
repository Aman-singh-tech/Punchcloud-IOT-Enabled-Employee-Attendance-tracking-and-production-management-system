import { useQuery } from "@tanstack/react-query";
import { payrollApi, useAuth } from "@punchcloud/shared";

export function useMyPayslips() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["myPayslips", user?.employeeId],
    queryFn: () => payrollApi.getHistory(user!.employeeId!),
    enabled: !!user?.employeeId,
  });
}

export function useMyPayslip(month?: number, year?: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["myPayslip", user?.employeeId, month, year],
    queryFn: () => payrollApi.getPayslip(user!.employeeId!, month!, year!),
    enabled: !!user?.employeeId && !!month && !!year,
  });
}
