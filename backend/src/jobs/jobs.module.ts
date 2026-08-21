import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AttendanceCronJob } from "./attendance-cron.job";
import { PayrollCronJob } from "./payroll-cron.job";
import { AttendanceModule } from "../modules/attendance/attendance.module";
import { PayrollModule } from "../modules/payroll/payroll.module";

@Module({
  imports: [ScheduleModule.forRoot(), AttendanceModule, PayrollModule],
  providers: [AttendanceCronJob, PayrollCronJob],
})
export class JobsModule {}
