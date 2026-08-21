import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { correctionApi } from "@punchcloud/shared";

export function useMyCorrections() {
  return useQuery({ queryKey: ["myCorrections"], queryFn: correctionApi.listMine });
}

export function useRaiseCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: correctionApi.raise,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myCorrections"] }),
  });
}
