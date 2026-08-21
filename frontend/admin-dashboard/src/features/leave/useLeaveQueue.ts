import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveApi } from "@punchcloud/shared";

export function useLeaveQueue(status = "pending") {
  return useQuery({ queryKey: ["leave", "requests", status], queryFn: () => leaveApi.list(status) });
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "approved" | "rejected" }) =>
      leaveApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leave"] }),
  });
}
