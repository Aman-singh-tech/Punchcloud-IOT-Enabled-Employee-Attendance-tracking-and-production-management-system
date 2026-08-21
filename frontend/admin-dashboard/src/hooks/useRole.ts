import { useAuth, Role } from "@punchcloud/shared";

export function useRole(): Role | undefined {
  const { user } = useAuth();
  return user?.role;
}
