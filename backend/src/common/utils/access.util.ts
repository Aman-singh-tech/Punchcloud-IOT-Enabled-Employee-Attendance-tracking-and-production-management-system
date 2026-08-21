import { ForbiddenException } from "@nestjs/common";
import { AuthenticatedUser } from "../decorators/current-user.decorator";
import { Role } from "../roles.enum";

// LLD Section 6: employee-scoped endpoints (e.g. GET /attendance/{employee_id}) verify the
// JWT's employee_id matches the path param unless the caller's role is in `elevatedRoles`.
export function assertSelfOrElevated(
  user: AuthenticatedUser,
  targetEmployeeId: number,
  elevatedRoles: Role[],
): void {
  if (elevatedRoles.includes(user.role)) {
    return;
  }
  if (user.employeeId === targetEmployeeId) {
    return;
  }
  throw new ForbiddenException("You may only access your own records");
}
