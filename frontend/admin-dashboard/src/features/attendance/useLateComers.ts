import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@punchcloud/shared";

export function useLateComers(month: number, year: number) {
  return useQuery({
    queryKey: ["attendance", "late-report", month, year],
    queryFn: () => attendanceApi.getLateReport(month, year),
  });
}
