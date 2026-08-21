import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../common/prisma.service";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<TokenPair & { user: unknown }> {
    const user = await this.prisma.userAccount.findUnique({
      where: { email },
      include: { role: true, employee: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = this.issueTokens(
      user.userId,
      user.employeeId,
      user.email,
      user.role?.name ?? "",
    );
    return {
      ...tokens,
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role?.name,
        employeeId: user.employeeId,
        employeeName: user.employee?.name,
      },
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      });
      const user = await this.prisma.userAccount.findUnique({
        where: { userId: payload.sub },
        include: { role: true },
      });
      if (!user || !user.isActive) {
        throw new UnauthorizedException("User no longer active");
      }
      return this.issueTokens(user.userId, user.employeeId, user.email, user.role?.name ?? "");
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  private issueTokens(
    userId: number,
    employeeId: number | null,
    email: string,
    role: string,
  ): TokenPair {
    const payload = { sub: userId, employeeId, email, role };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: this.config.get<string>("JWT_ACCESS_EXPIRES_IN") ?? "15m",
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.config.get<string>("JWT_REFRESH_EXPIRES_IN") ?? "7d",
    });
    return { accessToken, refreshToken };
  }
}
