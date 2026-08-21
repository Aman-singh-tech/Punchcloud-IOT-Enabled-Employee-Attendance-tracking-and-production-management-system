import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/roles.enum";

// Not an LLD endpoint. The design doc's dashboard (5.1) only showed today's punches, which
// the client found redundant with the Employees page — this backs a dashboard that leads
// with company-level monthly trends instead.
@ApiTags("dashboard")
@ApiBearerAuth()
@Controller("dashboard")
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get("summary")
  @Roles(Role.HR)
  getSummary(@Query("months") months?: string) {
    const parsed = months ? parseInt(months, 10) : 6;
    // Clamped so a stray ?months=500 can't turn the dashboard into a table scan.
    const safe = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 24) : 6;
    return this.dashboardService.getSummary(safe);
  }
}
