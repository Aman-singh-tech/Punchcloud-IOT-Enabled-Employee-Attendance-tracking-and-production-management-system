import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../../common/decorators/public.decorator";
import { IS_DEVICE_ROUTE_KEY } from "../../common/decorators/device-auth.decorator";

// Global guard. Skips JWT verification for routes marked @Public() (e.g. login)
// or @DeviceAuth() (those are checked by DeviceApiKeyGuard instead).
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const isDeviceRoute = this.reflector.getAllAndOverride<boolean>(IS_DEVICE_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic || isDeviceRoute) {
      return true;
    }
    return super.canActivate(context);
  }
}
