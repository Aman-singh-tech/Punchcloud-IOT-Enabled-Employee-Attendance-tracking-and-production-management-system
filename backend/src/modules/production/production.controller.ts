import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ProductionService } from "./production.service";
import { SubmitProductionEntryDto } from "./dto/submit-production-entry.dto";
import { UpdateProductionEntryDto } from "./dto/update-production-entry.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/roles.enum";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { assertSelfOrElevated } from "../../common/utils/access.util";

@ApiTags("production")
@ApiBearerAuth()
@Controller("production")
export class ProductionController {
  constructor(private productionService: ProductionService) {}

  @Post("entries")
  @Roles(Role.HR)
  submit(@Body() dto: SubmitProductionEntryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.productionService.submit(dto, user.userId);
  }

  @Patch("entries/:id")
  @Roles(Role.HR)
  correct(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateProductionEntryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productionService.correct(id, dto, user.userId);
  }

  @Get("report")
  @Roles(Role.HR)
  getReport(
    @Query("department") department: string | undefined,
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Query("employee_id") employeeId: string | undefined,
  ) {
    return this.productionService.getReport(
      department ? parseInt(department, 10) : undefined,
      from,
      to,
      employeeId ? parseInt(employeeId, 10) : undefined,
    );
  }

  @Get(":employee_id")
  @Roles(Role.EMPLOYEE, Role.HR)
  getHistory(
    @Param("employee_id", ParseIntPipe) employeeId: number,
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    assertSelfOrElevated(user, employeeId, [Role.HR]);
    return this.productionService.getHistory(employeeId, from, to);
  }
}
