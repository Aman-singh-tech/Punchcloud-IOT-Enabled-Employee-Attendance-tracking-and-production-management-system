import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AttendanceService } from "./attendance.service";
import { RecalculateDto } from "./dto/recalculate.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/roles.enum";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { assertSelfOrElevated } from "../../common/utils/access.util";

// LLD 2.2. NOTE: literal routes (today, late-report) are declared before the
// :employee_id param route so Nest's route matching doesn't try to parse them as an id.
@ApiTags("attendance")
@ApiBearerAuth()
@Controller("attendance")
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Get("today")
  @Roles(Role.HR)
  getToday() {
    return this.attendanceService.getToday();
  }

  @Get("late-report")
  @Roles(Role.HR)
  getLateReport(@Query("month") month: string, @Query("year") year: string) {
    return this.attendanceService.getLateReport(parseInt(month, 10), parseInt(year, 10));
  }

  @Post("recalculate")
  @Roles(Role.HR)
  recalculate(@Body() dto: RecalculateDto) {
    return this.attendanceService.recalculateRange(dto.employeeId, dto.from, dto.to);
  }

  @Get(":employee_id")
  @Roles(Role.HR, Role.EMPLOYEE)
  getHistory(
    @Param("employee_id", ParseIntPipe) employeeId: number,
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    assertSelfOrElevated(user, employeeId, [Role.HR]);
    return this.attendanceService.getHistory(employeeId, from, to);
  }
}
