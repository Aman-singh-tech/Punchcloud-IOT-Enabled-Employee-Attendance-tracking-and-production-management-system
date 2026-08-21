import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leaveApi } from "@punchcloud/shared";

export function useLeaveTypes() {
  return useQuery({ queryKey: ["leaveTypes"], queryFn: leaveApi.listLeaveTypes });
}

export function useSubmitLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveApi.submit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myLeaveRequests"] }),
  });
}

// GET /leave/requests scopes automatically to the caller's own employeeId for the
// Employee role server-side (see backend LeaveController.list) — no employeeId param
// needed or honored here.
export function useMyLeaveRequests(status?: string) {
  return useQuery({
    queryKey: ["myLeaveRequests", status],
    queryFn: () => leaveApi.list(status),
  });
}
