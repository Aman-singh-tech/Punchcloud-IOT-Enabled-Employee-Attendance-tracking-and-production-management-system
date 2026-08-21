import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { LeaveService } from "./leave.service";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";
import { UpdateLeaveStatusDto } from "./dto/update-leave-status.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/roles.enum";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { assertSelfOrElevated } from "../../common/utils/access.util";

@ApiTags("leave")
@ApiBearerAuth()
@Controller("leave")
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @Post("requests")
  @Roles(Role.EMPLOYEE)
  submit(@Body() dto: CreateLeaveRequestDto, @CurrentUser() user: AuthenticatedUser) {
    if (!user.employeeId) {
      throw new BadRequestException("This account is not linked to an employee record");
    }
    return this.leaveService.submit(user.employeeId, dto);
  }

  // LLD 2.3 only documents this for HR (approval queue). Employee self-access is added
  // here, matching every other module's self-access pattern (attendance, production,
  // payroll, employee) — the frontend structure doc explicitly requires a
  // MyLeaveRequestsPage, which is unbuildable without this. An Employee caller is always
  // forced to their own employeeId regardless of what they pass; only HR can see
  // other employees' requests.
  @Get("requests")
  @Roles(Role.EMPLOYEE, Role.HR)
  list(@Query("status") status: string | undefined, @CurrentUser() user: AuthenticatedUser) {
    if (user.role === Role.EMPLOYEE) {
      if (!user.employeeId) {
        throw new BadRequestException("This account is not linked to an employee record");
      }
      return this.leaveService.listByStatus(status, user.employeeId);
    }
    return this.leaveService.listByStatus(status);
  }

  @Patch("requests/:id")
  @Roles(Role.HR)
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateLeaveStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveService.updateStatus(id, dto.status, user.userId);
  }

  @Get("balance/:employee_id")
  @Roles(Role.EMPLOYEE, Role.HR)
  getBalance(
    @Param("employee_id", ParseIntPipe) employeeId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    assertSelfOrElevated(user, employeeId, [Role.HR]);
    return this.leaveService.getBalance(employeeId);
  }
}
