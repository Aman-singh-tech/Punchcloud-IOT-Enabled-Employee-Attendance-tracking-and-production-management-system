import { Controller, Get, Param, ParseIntPipe, Post, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { PayrollService } from "./payroll.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/roles.enum";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { assertSelfOrElevated } from "../../common/utils/access.util";

// Header names must match getDisbursementFileRows' actual object keys exactly — the empty
// case previously hardcoded a snake_case header while non-empty rows produced camelCase
// (Object.keys of the real row), so the file's header row silently changed shape depending
// on whether any payroll was finalized yet. Any downstream tooling parsing by column name
// would have broken the moment the first month with data appeared.
const DISBURSEMENT_COLUMNS = ["employeeCode", "employeeName", "netPay", "month", "year"] as const;

function toCsv(rows: Array<Record<string, string | number>>): string {
  if (rows.length === 0) return `${DISBURSEMENT_COLUMNS.join(",")}\n`;
  const header = DISBURSEMENT_COLUMNS.join(",");
  const lines = rows.map((r) => DISBURSEMENT_COLUMNS.map((c) => r[c]).join(","));
  return [header, ...lines].join("\n");
}

// LLD 2.5. Literal routes (generate, disbursement-file) are declared before the
// :employee_id param route for the same reason as attendance/production controllers.
@ApiTags("payroll")
@ApiBearerAuth()
@Controller("payroll")
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  @Post("generate")
  @Roles(Role.HR)
  generate(@Query("month") month: string, @Query("year") year: string) {
    return this.payrollService.generateForAllEmployees(parseInt(month, 10), parseInt(year, 10));
  }

  @Get()
  @Roles(Role.HR)
  listByPeriod(@Query("month") month: string, @Query("year") year: string) {
    return this.payrollService.listByPeriod(parseInt(month, 10), parseInt(year, 10));
  }

  // Client-requested change: this company has a single admin/HR person, not a separate
  // Finance role — disbursement file access moved to HR.
  @Get("disbursement-file")
  @Roles(Role.HR)
  async disbursementFile(
    @Query("month") month: string,
    @Query("year") year: string,
    @Res() res: Response,
  ) {
    const rows = await this.payrollService.getDisbursementFileRows(
      parseInt(month, 10),
      parseInt(year, 10),
    );
    const csv = toCsv(rows);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="disbursement-${year}-${month}.csv"`,
    );
    res.send(csv);
  }

  @Post(":payroll_id/finalize")
  @Roles(Role.HR)
  finalize(@Param("payroll_id", ParseIntPipe) payrollId: number) {
    return this.payrollService.finalize(payrollId);
  }

  @Get(":employee_id/history")
  @Roles(Role.EMPLOYEE, Role.HR)
  history(
    @Param("employee_id", ParseIntPipe) employeeId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    assertSelfOrElevated(user, employeeId, [Role.HR]);
    return this.payrollService.getHistory(employeeId);
  }

  @Get(":employee_id")
  @Roles(Role.EMPLOYEE, Role.HR)
  getPayslip(
    @Param("employee_id", ParseIntPipe) employeeId: number,
    @Query("month") month: string,
    @Query("year") year: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    assertSelfOrElevated(user, employeeId, [Role.HR]);
    return this.payrollService.getPayslip(employeeId, parseInt(month, 10), parseInt(year, 10));
  }
}
