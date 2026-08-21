import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { EmployeesService } from "./employees.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { CreateSalaryStructureDto } from "./dto/create-salary-structure.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/roles.enum";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { assertSelfOrElevated } from "../../common/utils/access.util";

// LLD 2.7: CRUD /employees — HR only, including employee_type at onboarding.
// GET :employee_id is the one exception: an Employee may fetch their own record (self-
// service needs to know its own employee_type to decide whether to show the production
// tab — LLD gives no dedicated "/me" endpoint, and every other module in this API already
// allows self-access on the analogous read endpoint, so this follows the same pattern).
@ApiTags("employees")
@ApiBearerAuth()
@Controller("employees")
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Post()
  @Roles(Role.HR)
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Get()
  @Roles(Role.HR)
  findAll() {
    return this.employeesService.findAll();
  }

  @Get(":employee_id")
  @Roles(Role.HR, Role.EMPLOYEE)
  findOne(
    @Param("employee_id", ParseIntPipe) employeeId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    assertSelfOrElevated(user, employeeId, [Role.HR]);
    return this.employeesService.findOne(employeeId);
  }

  @Patch(":employee_id")
  @Roles(Role.HR)
  update(@Param("employee_id", ParseIntPipe) employeeId: number, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(employeeId, dto);
  }

  @Post(":employee_id/salary-structure")
  @Roles(Role.HR)
  changeSalaryStructure(
    @Param("employee_id", ParseIntPipe) employeeId: number,
    @Body() dto: CreateSalaryStructureDto,
  ) {
    return this.employeesService.changeSalaryStructure(employeeId, dto);
  }

  // Not an LLD endpoint — added so HR has some way to recover a forgotten employee login
  // without email/SMS infrastructure (see conversation: no self-service "forgot password"
  // exists yet since that needs SES, which isn't wired up). Returns the new plaintext
  // password exactly once; HR relays it to the employee directly.
  @Post(":employee_id/reset-password")
  @Roles(Role.HR)
  resetPassword(@Param("employee_id", ParseIntPipe) employeeId: number) {
    return this.employeesService.resetPassword(employeeId);
  }
}
