import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productionApi } from "@punchcloud/shared";

export function useSubmitProductionEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productionApi.submit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["production"] }),
  });
}
