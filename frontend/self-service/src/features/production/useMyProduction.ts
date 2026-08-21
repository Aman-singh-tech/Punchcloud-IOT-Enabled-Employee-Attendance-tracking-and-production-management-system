import { useQuery } from "@tanstack/react-query";
import { productionApi, useAuth } from "@punchcloud/shared";

export function useMyProduction(from?: string, to?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["myProduction", user?.employeeId, from, to],
    queryFn: () => productionApi.getHistory(user!.employeeId!, from, to),
    enabled: !!user?.employeeId,
  });
}
