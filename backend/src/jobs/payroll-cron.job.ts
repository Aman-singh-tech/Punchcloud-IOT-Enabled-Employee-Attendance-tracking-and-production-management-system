import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PayrollService } from "../modules/payroll/payroll.service";
import { previousMonthOf, todayDateKey } from "../common/utils/wall-clock.util";

// LLD 3.3 / Section 4 sequence flow: "1st of month, cron" -> Payroll Engine runs for the
// month that just closed.
@Injectable()
export class PayrollCronJob {
  private readonly logger = new Logger(PayrollCronJob.name);

  constructor(private payrollService: PayrollService) {}

  @Cron("0 2 1 * *") // 1st of every month at 02:00
  async handleMonthlyPayroll(): Promise<void> {
    // Payroll for the month that just ended, resolved in the company's timezone.
    // Reading the month off the UTC clock was wrong by a whole month: this cron fires at
    // 02:00 on the 1st, which in India is still 20:30 on the LAST day of the outgoing month
    // in UTC — so `getUTCMonth() - 1` pointed two months back and would have generated
    // July's payroll on the 1st of September.
    const { month, year } = previousMonthOf(todayDateKey());
    this.logger.log(`Running monthly payroll generation for ${month}/${year}`);
    const results = await this.payrollService.generateForAllEmployees(month, year);
    const failed = results.filter((r) => !r.ok);
    this.logger.log(
      `Monthly payroll generation complete for ${month}/${year}: ${results.length - failed.length} ok, ${failed.length} failed`,
    );
  }
}
