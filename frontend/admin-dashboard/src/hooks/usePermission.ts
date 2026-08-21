import { Role } from "@punchcloud/shared";
import { useRole } from "./useRole";

export function usePermission(allowedRoles: Role[]): boolean {
  const role = useRole();
  return !!role && allowedRoles.includes(role);
}
