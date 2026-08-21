import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@punchcloud/shared";

export function useTodayAttendance() {
  return useQuery({ queryKey: ["attendance", "today"], queryFn: attendanceApi.getToday });
}

export function useAttendanceHistory(employeeId: number, from?: string, to?: string) {
  return useQuery({
    queryKey: ["attendance", "history", employeeId, from, to],
    queryFn: () => attendanceApi.getHistory(employeeId, from, to),
    enabled: !!employeeId,
  });
}

export function useRecalculateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ from, to, employeeId }: { from: string; to: string; employeeId?: number }) =>
      attendanceApi.recalculate(from, to, employeeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });
}
