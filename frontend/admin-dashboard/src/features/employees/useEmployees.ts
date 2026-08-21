import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeApi, CreateEmployeeInput } from "@punchcloud/shared";

export function useEmployees() {
  return useQuery({ queryKey: ["employees"], queryFn: employeeApi.list });
}

export function useEmployee(employeeId?: number) {
  return useQuery({
    queryKey: ["employees", employeeId],
    queryFn: () => employeeApi.get(employeeId!),
    enabled: !!employeeId,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => employeeApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, input }: { employeeId: number; input: Partial<CreateEmployeeInput> }) =>
      employeeApi.update(employeeId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (employeeId: number) => employeeApi.resetPassword(employeeId),
  });
}
