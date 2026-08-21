import { useMutation, useQueryClient } from "@tanstack/react-query";
import { payrollApi } from "@punchcloud/shared";

export function useGeneratePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) => payrollApi.generate(month, year),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll"] }),
  });
}
