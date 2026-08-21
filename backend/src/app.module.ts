import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CommonModule } from "./common/common.module";
import { HealthController } from "./common/health.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { EmployeesModule } from "./modules/employees/employees.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { IngestionModule } from "./modules/ingestion/ingestion.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { ProductionModule } from "./modules/production/production.module";
import { LeaveModule } from "./modules/leave/leave.module";
import { PayrollModule } from "./modules/payroll/payroll.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { JobsModule } from "./jobs/jobs.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    AuthModule,
    EmployeesModule,
    SettingsModule,
    IngestionModule,
    AttendanceModule,
    ProductionModule,
    LeaveModule,
    PayrollModule,
    DashboardModule,
    NotificationsModule,
    JobsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
