import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { payrollApi } from "@punchcloud/shared";

export function usePayslip(employeeId?: number, month?: number, year?: number) {
  return useQuery({
    queryKey: ["payroll", "payslip", employeeId, month, year],
    queryFn: () => payrollApi.getPayslip(employeeId!, month!, year!),
    enabled: !!employeeId && !!month && !!year,
  });
}

export function usePayrollHistory(employeeId?: number) {
  return useQuery({
    queryKey: ["payroll", "history", employeeId],
    queryFn: () => payrollApi.getHistory(employeeId!),
    enabled: !!employeeId,
  });
}

export function useFinalizePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payrollId: string) => payrollApi.finalize(payrollId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll"] }),
  });
}
