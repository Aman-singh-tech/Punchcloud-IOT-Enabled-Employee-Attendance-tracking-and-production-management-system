import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AttendanceService } from "../modules/attendance/attendance.service";
import { addDaysToDateKey, todayDateKey } from "../common/utils/wall-clock.util";

// LLD 3.1: "Runs nightly for the previous day (via cron)". Maps to the EventBridge cron ->
// Lambda/ECS scheduled task in the deployment mapping (Section 7); the handler itself is
// deployment-agnostic so it can also be invoked directly from a Lambda entrypoint.
@Injectable()
export class AttendanceCronJob {
  private readonly logger = new Logger(AttendanceCronJob.name);

  constructor(private attendanceService: AttendanceService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleNightlyAttendance(): Promise<void> {
    // Resolved in the company's timezone, not the server's and not UTC. The cron fires at
    // 01:00 local, which is still the *previous* UTC day in India — computing "yesterday"
    // from the UTC date therefore skipped a day every single night.
    const yesterday = addDaysToDateKey(todayDateKey(), -1);
    this.logger.log(`Running nightly attendance computation for ${yesterday}`);
    await this.attendanceService.computeForAllEmployees(yesterday);
    this.logger.log(`Nightly attendance computation complete for ${yesterday}`);
  }
}
