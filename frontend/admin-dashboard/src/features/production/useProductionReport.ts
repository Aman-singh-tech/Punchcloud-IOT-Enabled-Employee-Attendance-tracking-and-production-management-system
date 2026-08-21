import { useQuery } from "@tanstack/react-query";
import { productionApi } from "@punchcloud/shared";

export function useProductionReport(
  department?: number,
  from?: string,
  to?: string,
  employeeId?: number,
) {
  return useQuery({
    queryKey: ["production", "report", department, from, to, employeeId],
    queryFn: () => productionApi.getReport(department, from, to, employeeId),
  });
}
