import { useQuery } from "@tanstack/react-query";
import { attendanceApi, useAuth } from "@punchcloud/shared";

export function useMyAttendance(from?: string, to?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["myAttendance", user?.employeeId, from, to],
    queryFn: () => attendanceApi.getHistory(user!.employeeId!, from, to),
    enabled: !!user?.employeeId,
  });
}
