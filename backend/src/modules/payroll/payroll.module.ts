import { Module } from "@nestjs/common";
import { PayrollService } from "./payroll.service";
import { PayrollController } from "./payroll.controller";
import { PayslipPdfService } from "./payslip-pdf.service";
import { EmployeesModule } from "../employees/employees.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [EmployeesModule, NotificationsModule],
  controllers: [PayrollController],
  providers: [PayrollService, PayslipPdfService],
  exports: [PayrollService],
})
export class PayrollModule {}
