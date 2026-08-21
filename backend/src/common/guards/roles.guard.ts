import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { Role } from "../roles.enum";
import { AuthenticatedUser } from "../decorators/current-user.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // no @Roles() decorator => any authenticated user may call it
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Role '${user?.role ?? "unknown"}' is not permitted to access this resource`,
      );
    }
    return true;
  }
}
