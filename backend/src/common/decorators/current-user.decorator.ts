import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Role } from "../roles.enum";

export interface AuthenticatedUser {
  userId: number;
  employeeId: number | null;
  email: string;
  role: Role;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
