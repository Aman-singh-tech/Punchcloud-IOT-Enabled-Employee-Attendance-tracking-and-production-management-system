import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import * as bcrypt from "bcrypt";
import { IS_DEVICE_ROUTE_KEY } from "../decorators/device-auth.decorator";
import { PrismaService } from "../prisma.service";

// Device-facing routes (ingestion) authenticate via a per-device API key header,
// not a user JWT (LLD Section 2.1, Section 6). Skips non-device routes entirely.
@Injectable()
export class DeviceApiKeyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isDeviceRoute = this.reflector.getAllAndOverride<boolean>(IS_DEVICE_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isDeviceRoute) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-device-api-key"];
    const deviceIdParam = request.params?.device_id;
    if (!apiKey || !deviceIdParam) {
      throw new UnauthorizedException("Missing device API key or device_id");
    }

    const deviceId = parseInt(deviceIdParam, 10);
    const device = await this.prisma.device.findUnique({ where: { deviceId } });
    if (!device?.apiKeyHash) {
      throw new UnauthorizedException("Unknown device or device not provisioned with an API key");
    }

    const matches = await bcrypt.compare(apiKey, device.apiKeyHash);
    if (!matches) {
      throw new UnauthorizedException("Invalid device API key");
    }

    request.device = device;
    return true;
  }
}
