import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { APP_GUARD } from "@nestjs/core";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { DeviceApiKeyGuard } from "../../common/guards/device-api-key.guard";

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // Global guard order: JwtAuthGuard (authenticates or skips @Public/@DeviceAuth routes)
    // -> DeviceApiKeyGuard (authenticates @DeviceAuth routes) -> RolesGuard (authorizes).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: DeviceApiKeyGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
