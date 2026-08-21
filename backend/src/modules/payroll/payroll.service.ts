import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { S3Service } from "../../common/s3.service";
import { SalaryStructureRepository } from "../employees/salary-structure.repository";
import { PayslipPdfService } from "./payslip-pdf.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  calculateFixedSalaryNetPay,
  calculatePayableDays,
  calculatePieceRateNetPay,
} from "./payroll-calculation";
import { calculateWorkingDays, daysInMonth } from "./working-days.util";
import { parseDateOnly } from "../../common/utils/wall-clock.util";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface PayrollGenerationResult {
  employeeId: number;
  ok: boolean;
  payrollId?: string;
  error?: string;
}

// LLD 3.3 — implemented exactly as pseudocoded. Exactly two paths, no third/else branch.
@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
    private salaryStructures: SalaryStructureRepository,
    private payslipPdf: PayslipPdfService,
    private notifications: NotificationsService,
  ) {}

  async generatePayroll(employeeId: number, month: number, year: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { employeeId },
      include: { shift: true, department: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    const asOf = new Date(Date.UTC(year, month - 1, daysInMonth(month, year)));
    const salary = await this.salaryStructures.getActiveAsOf(employeeId, asOf);
    if (!salary) {
      throw new BadRequestException(
        `Employee ${employeeId} has no salary structure active as of ${asOf.toISOString().slice(0, 10)}`,
      );
    }

    // Attendance summary is computed and stored for every employee regardless of type —
    // for piece_rate it is purely informational for HR (it never touches their pay), and for
    // fixed_salary it is the ONLY input to net_pay.
    const attendanceSummary = await this.getAttendanceSummary(employeeId, month, year);

    let netPay: number;
    let workingDays: number | null = null;
    let totalProduced: number | null = null;
    let totalAccepted: number | null = null;
    let totalRejected: number | null = null;

    if (salary.employeeType === "piece_rate") {
      const production = await this.getProductionSummary(employeeId, month, year);
      totalProduced = production.totalProduced;
      totalAccepted = production.totalAccepted;
      totalRejected = production.totalRejected;
      // CONFIRMED: nothing else touches this number — not attendance, not leave (paid or
      // unpaid), not lateness, not OT.
      netPay = calculatePieceRateNetPay(totalAccepted, salary.perRecordRate ?? 0);
    } else if (salary.employeeType === "fixed_salary") {
      const weeklyOffDays = employee.shift?.weeklyOffDays ?? [0];
      const festivalHolidays = await this.countFestivalHolidaysInMonth(
        month,
        year,
        employee.locationId,
        weeklyOffDays,
      );
      workingDays = calculateWorkingDays(month, year, weeklyOffDays, festivalHolidays);

      // CONFIRMED: only days actually worked are paid, with a half-day worth 0.5.
      // total_ot_minutes and leave days are stored and shown on the payslip, but neither
      // enters net_pay — this company pays no overtime and offers no paid leave.
      const payableDays = calculatePayableDays(
        attendanceSummary.daysPresent,
        attendanceSummary.daysHalfDay,
      );
      netPay = calculateFixedSalaryNetPay(
        payableDays,
        workingDays,
        salary.monthlyBaseSalary ?? 0,
      );
    } else {
      // No third path exists — every employee must be one of exactly these two types.
      throw new BadRequestException(
        `Unknown employee_type '${salary.employeeType}' for employee ${employeeId}`,
      );
    }

    const pdfBuffer = await this.payslipPdf.render({
      employeeName: employee.name,
      employeeCode: employee.employeeCode,
      designation: employee.designation,
      month,
      year,
      employeeType: salary.employeeType,
      daysPresent: attendanceSummary.daysPresent,
      daysHalfDay: attendanceSummary.daysHalfDay,
      daysLate: attendanceSummary.daysLate,
      daysAbsent: attendanceSummary.daysAbsent,
      daysOnPaidLeave: attendanceSummary.daysOnPaidLeave,
      daysOnUnpaidLeave: attendanceSummary.daysOnUnpaidLeave,
      daysOff: attendanceSummary.daysOff,
      workingDays,
      totalLateMinutes: attendanceSummary.totalLateMinutes,
      totalOtMinutes: attendanceSummary.totalOtMinutes,
      totalProduced,
      totalAccepted,
      totalRejected,
      netPay,
    });
    const reportS3Key = `payroll-reports/${year}/${String(month).padStart(2, "0")}/${employeeId}.pdf`;
    await this.s3.putBuffer(reportS3Key, pdfBuffer, "application/pdf");

    const record = await this.prisma.payrollRecord.upsert({
      where: { employeeId_month_year: { employeeId, month, year } },
      create: {
        employeeId,
        month,
        year,
        employeeType: salary.employeeType,
        daysPresent: attendanceSummary.daysPresent,
        daysHalfDay: attendanceSummary.daysHalfDay,
        daysLate: attendanceSummary.daysLate,
        daysAbsent: attendanceSummary.daysAbsent,
        daysOnPaidLeave: attendanceSummary.daysOnPaidLeave,
        daysOnUnpaidLeave: attendanceSummary.daysOnUnpaidLeave,
        daysOff: attendanceSummary.daysOff,
        workingDays,
        totalLateMinutes: attendanceSummary.totalLateMinutes,
        totalOtMinutes: attendanceSummary.totalOtMinutes,
        totalProduced,
        totalAccepted,
        totalRejected,
        netPay,
        reportS3Key,
        status: "draft",
      },
      update: {
        employeeType: salary.employeeType,
        daysPresent: attendanceSummary.daysPresent,
        daysHalfDay: attendanceSummary.daysHalfDay,
        daysLate: attendanceSummary.daysLate,
        daysAbsent: attendanceSummary.daysAbsent,
        daysOnPaidLeave: attendanceSummary.daysOnPaidLeave,
        daysOnUnpaidLeave: attendanceSummary.daysOnUnpaidLeave,
        daysOff: attendanceSummary.daysOff,
        workingDays,
        totalLateMinutes: attendanceSummary.totalLateMinutes,
        totalOtMinutes: attendanceSummary.totalOtMinutes,
        totalProduced,
        totalAccepted,
        totalRejected,
        netPay,
        reportS3Key,
      },
    });

    return record;
  }

  // LLD 5 error-handling table: each employee's payroll computation is independent — one
  // failure doesn't block others.
  async generateForAllEmployees(month: number, year: number): Promise<PayrollGenerationResult[]> {
    const employees = await this.prisma.employee.findMany({
      where: { status: "active" },
      select: { employeeId: true },
    });

    const results: PayrollGenerationResult[] = [];
    for (const emp of employees) {
      try {
        const existing = await this.prisma.payrollRecord.findUnique({
          where: { employeeId_month_year: { employeeId: emp.employeeId, month, year } },
        });
        if (existing?.status === "finalized" || existing?.status === "paid") {
          results.push({
            employeeId: emp.employeeId,
            ok: false,
            error: `Payroll already ${existing.status}; use the regenerate override to recompute`,
          });
          continue;
        }
        const record = await this.generatePayroll(emp.employeeId, month, year);
        results.push({
          employeeId: emp.employeeId,
          ok: true,
          payrollId: record.payrollId.toString(),
        });
      } catch (err: any) {
        this.logger.error(
          `Payroll generation failed for employee ${emp.employeeId}: ${err.message}`,
        );
        results.push({ employeeId: emp.employeeId, ok: false, error: err.message });
      }
    }
    return results;
  }

  async getPayslip(employeeId: number, month: number, year: number) {
    const record = await this.prisma.payrollRecord.findUnique({
      where: { employeeId_month_year: { employeeId, month, year } },
    });
    if (!record) {
      throw new NotFoundException(
        `No payroll record for employee ${employeeId} in ${month}/${year}`,
      );
    }
    const downloadUrl = record.reportS3Key
      ? await this.s3.getSignedDownloadUrl(record.reportS3Key)
      : null;
    return { ...record, downloadUrl };
  }

  // Not an explicit LLD endpoint, but design doc 5.7 requires an HR review screen before
  // finalizing a payroll run ("one-click Generate Payroll + review before finalizing"),
  // which is unbuildable without a way to list a month's records across employees.
  async listByPeriod(month: number, year: number) {
    return this.prisma.payrollRecord.findMany({
      where: { month, year },
      include: { employee: { select: { employeeId: true, name: true, employeeCode: true } } },
      orderBy: { employeeId: "asc" },
    });
  }

  async getHistory(employeeId: number) {
    return this.prisma.payrollRecord.findMany({
      where: { employeeId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
  }

  async finalize(payrollId: number) {
    const record = await this.prisma.payrollRecord.findUnique({ where: { payrollId } });
    if (!record) {
      throw new NotFoundException(`Payroll record ${payrollId} not found`);
    }
    if (record.status !== "draft") {
      throw new ForbiddenException(`Payroll record ${payrollId} is already ${record.status}`);
    }
    const finalized = await this.prisma.payrollRecord.update({
      where: { payrollId },
      data: { status: "finalized" },
    });

    if (record.employeeId && record.month && record.year) {
      await this.notifications.notifyEmployee(
        record.employeeId,
        "payslip_ready",
        `Your payslip for ${MONTH_NAMES[record.month - 1]} ${record.year} is ready`,
        "/payslips",
      );
    }

    return finalized;
  }

  // LLD 2.5 /payroll/disbursement-file — NEFT/RTGS-style CSV export, file generation only
  // (no live bank payment integration, per scope).
  async getDisbursementFileRows(month: number, year: number) {
    const records = await this.prisma.payrollRecord.findMany({
      where: { month, year, status: { in: ["finalized", "paid"] } },
      include: { employee: true },
      orderBy: { employeeId: "asc" },
    });
    return records.map((r) => ({
      employeeCode: r.employee?.employeeCode ?? "",
      employeeName: r.employee?.name ?? "",
      netPay: r.netPay?.toString() ?? "0.00",
      month: r.month ?? 0,
      year: r.year ?? 0,
    }));
  }

  private async getAttendanceSummary(employeeId: number, month: number, year: number) {
    const from = parseDateOnly(`${year}-${String(month).padStart(2, "0")}-01`);
    const to = new Date(Date.UTC(year, month, 0));

    const rows = await this.prisma.attendanceDaily.findMany({
      where: { employeeId, attendanceDate: { gte: from, lte: to } },
      include: { leaveType: true },
    });

    let daysPresent = 0;
    let daysHalfDay = 0;
    let daysLate = 0;
    let daysOnPaidLeave = 0;
    let daysOnUnpaidLeave = 0;
    let daysAbsent = 0;
    let daysOff = 0;
    let totalLateMinutes = 0;
    let totalOtMinutes = 0;

    for (const row of rows) {
      if (row.isLate) daysLate++;
      // daysPresent is FULL days only. Half-days are counted separately and weighted 0.5
      // when net_pay is computed, so a half-day genuinely costs half a day's salary.
      if (row.status === "Present") daysPresent++;
      else if (row.status === "Half-day") daysHalfDay++;
      // Both leave buckets are REPORTING ONLY. This company has no paid leave, so neither
      // count reaches net_pay — a leave day is simply not a present day. The paid/unpaid
      // split is kept because leave_type still carries is_paid and HR's reports use it.
      else if (row.status === "On Leave" && row.leaveType?.isPaid) daysOnPaidLeave++;
      else if (row.status === "On Leave" && !row.leaveType?.isPaid) daysOnUnpaidLeave++;
      else if (row.status === "Absent") daysAbsent++;
      // "Off" = weekly off or office closed. Excluded from working_days rather than counted
      // here, so it neither earns nor deducts.
      else if (row.status === "Off") daysOff++;
      totalLateMinutes += row.lateMinutes;
      totalOtMinutes += row.otMinutes;
    }

    return {
      daysPresent,
      daysHalfDay,
      daysLate,
      daysOnPaidLeave,
      daysOnUnpaidLeave,
      daysAbsent,
      daysOff,
      totalLateMinutes,
      totalOtMinutes,
    };
  }

  /**
   * Festival holidays (Diwali / Holi) falling in this month that are NOT already a weekly
   * off, so `calculateWorkingDays` never subtracts the same day twice.
   *
   * Without this filter, a Diwali that lands on a Sunday would shrink working_days by 2 for
   * a single non-working day — and a fully-present employee would be paid MORE than their
   * monthly salary (e.g. 26 present / 25 working days × 25,000 = 26,000).
   */
  private async countFestivalHolidaysInMonth(
    month: number,
    year: number,
    locationId: number | null,
    weeklyOffDays: number[],
  ): Promise<number> {
    const from = parseDateOnly(`${year}-${String(month).padStart(2, "0")}-01`);
    const to = new Date(Date.UTC(year, month, 0));
    const holidays = await this.prisma.holidayCalendar.findMany({
      where: {
        holidayDate: { gte: from, lte: to },
        OR: [{ locationId: null }, { locationId: locationId ?? undefined }],
      },
      select: { holidayDate: true },
    });

    const uniqueDates = new Set(holidays.map((h) => h.holidayDate.toISOString().slice(0, 10)));
    let count = 0;
    for (const key of uniqueDates) {
      if (!weeklyOffDays.includes(parseDateOnly(key).getUTCDay())) {
        count++;
      }
    }
    return count;
  }

  private async getProductionSummary(employeeId: number, month: number, year: number) {
    const from = parseDateOnly(`${year}-${String(month).padStart(2, "0")}-01`);
    const to = new Date(Date.UTC(year, month, 0));
    const rows = await this.prisma.productionEntry.findMany({
      where: { employeeId, entryDate: { gte: from, lte: to } },
    });
    return rows.reduce(
      (acc, r) => {
        acc.totalProduced += r.recordsProduced;
        acc.totalAccepted += r.recordsAccepted;
        acc.totalRejected += r.recordsRejected;
        return acc;
      },
      { totalProduced: 0, totalAccepted: 0, totalRejected: 0 },
    );
  }

}
