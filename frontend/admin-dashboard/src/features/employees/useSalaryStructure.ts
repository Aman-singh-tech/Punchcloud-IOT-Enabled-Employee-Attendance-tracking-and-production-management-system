import { useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeApi, CreateSalaryStructureInput } from "@punchcloud/shared";

export function useChangeSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, input }: { employeeId: number; input: CreateSalaryStructureInput }) =>
      employeeApi.changeSalaryStructure(employeeId, input),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["employees", vars.employeeId] });
    },
  });
}
