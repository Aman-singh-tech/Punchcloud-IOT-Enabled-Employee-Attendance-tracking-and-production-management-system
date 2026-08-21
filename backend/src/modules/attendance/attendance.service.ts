import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import {
  addMinutes,
  combineDateAndTimeOfDay,
  diffMinutes,
  parseDateOnly,
  todayDateKey,
} from "../../common/utils/wall-clock.util";

export type AttendanceStatus = "Present" | "Absent" | "Half-day" | "On Leave" | "Off";

// Status resolution order (client-confirmed 2026-08-21):
//   Off (weekly off, or a festival holiday) → punched → Present/Half-day → On Leave → Absent
//
// There is no separate "Holiday" status. The company observes exactly two festival holidays a
// year (Diwali and Holi), entered by HR into `holiday_calendar`; those days land in the same
// "Off" bucket as a Sunday and are excluded from working_days the same way, which is what
// makes them cost a fixed-salary employee nothing.
//
// "Off" WINS OVER PUNCHES (client decision 2026-08-21). An employee who comes in on a Sunday
// or on Diwali is still "Off" for the day — their punches are recorded for HR's reference,
// but the day earns nothing extra. Letting punches win instead would have paid *more* than
// the monthly salary: the day is outside working_days (the denominator) while adding to the
// present count (the numerator), so a fully-present employee who also worked one holiday
// would land above 100% of their salary. That also keeps this consistent with the rule that
// nobody is ever paid for extra hours.
//
// Consequences of Off winning: no late/OT minutes are computed on an Off day (there is no
// shift to be late for), and `is_late` stays false so an off-day arrival never eats into the
// monthly late allowance.
//
// "Off" is also resolved BEFORE approved leave, so a leave request spanning a weekend does
// not burn leave balance on the weekend days.
@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async computeAttendance(employeeId: number, dateStr: string): Promise<void> {
    const date = parseDateOnly(dateStr);

    const existing = await this.prisma.attendanceDaily.findUnique({
      where: { employeeId_attendanceDate: { employeeId, attendanceDate: date } },
    });
    // Never silently overwrite a manually-adjusted/corrected record (Section 6.7).
    if (existing?.isManuallyAdjusted) {
      return;
    }

    const dayStart = date;
    const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000);

    const [punches, employee] = await Promise.all([
      this.prisma.punchLog.findMany({
        where: {
          employeeId,
          punchTimestamp: { gte: dayStart, lt: dayEnd },
        },
        orderBy: { punchTimestamp: "asc" },
      }),
      this.prisma.employee.findUnique({
        where: { employeeId },
        include: { shift: true },
      }),
    ]);
    const shift = employee?.shift;

    // ---- Off days are decided first, and they win even if the employee punched. ----

    // Weekly off (Sunday by default) — before 2026-08-21 these silently became "Absent",
    // which inflated the absent count on every payslip even though the day was never payable.
    const weeklyOffDays = shift?.weeklyOffDays ?? [0];
    const isWeeklyOff = weeklyOffDays.includes(date.getUTCDay());

    // Festival holiday (Diwali / Holi) — office shut for everyone. Same bucket as a weekly
    // off: excluded from working_days, so a fixed-salary employee isn't docked and a
    // piece-rate employee simply has no pieces that day.
    const festivalHoliday = isWeeklyOff
      ? null
      : await this.prisma.holidayCalendar.findFirst({
          where: {
            holidayDate: date,
            OR: [{ locationId: null }, { locationId: employee?.locationId ?? undefined }],
          },
        });

    if (isWeeklyOff || festivalHoliday) {
      // Punches on an off day are kept as a record of who was in the building, but the day
      // is not payable and carries no late/OT figures.
      await this.upsert(employeeId, date, {
        firstIn: punches[0]?.punchTimestamp,
        lastOut: punches[punches.length - 1]?.punchTimestamp,
        status: "Off",
      });
      return;
    }

    if (punches.length === 0) {
      const approvedLeave = await this.prisma.leaveRequest.findFirst({
        where: {
          employeeId,
          status: "approved",
          fromDate: { lte: date },
          toDate: { gte: date },
        },
      });
      if (approvedLeave) {
        await this.upsert(employeeId, date, {
          status: "On Leave",
          leaveTypeId: approvedLeave.leaveTypeId,
        });
        return;
      }

      await this.upsert(employeeId, date, { status: "Absent" });
      return;
    }

    const firstIn = punches[0].punchTimestamp;
    const lastOut = punches[punches.length - 1].punchTimestamp;

    let lateMinutes = 0;
    let otMinutes = 0;
    let isLate = false;
    if (shift) {
      const shiftStartOnDate = combineDateAndTimeOfDay(date, shift.startTime);
      const graceEnd = addMinutes(shiftStartOnDate, shift.gracePeriodMinutes);
      lateMinutes = Math.max(0, Math.round(diffMinutes(graceEnd, firstIn)));

      // The late-comer policy is measured from start_time itself, not from the grace period
      // — "punch-in time se 15 minute baad" is what the client asked for.
      const lateCutoff = addMinutes(shiftStartOnDate, shift.lateThresholdMinutes);
      isLate = firstIn > lateCutoff;

      const shiftEndOnDate = combineDateAndTimeOfDay(date, shift.endTime);
      otMinutes = Math.max(0, Math.round(diffMinutes(shiftEndOnDate, lastOut)));
    }

    // One punch means the employee never punched out — that day is a Half-day regardless of
    // when they arrived. Otherwise the monthly late allowance decides.
    let status: AttendanceStatus;
    if (punches.length === 1) {
      status = "Half-day";
    } else if (isLate && (await this.exceedsMonthlyLateAllowance(employeeId, date, shift))) {
      status = "Half-day";
    } else {
      status = "Present";
    }

    await this.upsert(employeeId, date, {
      firstIn,
      lastOut,
      lateMinutes,
      // Recorded for every employee, but never paid — this company pays no overtime.
      otMinutes,
      isLate,
      status,
      leaveTypeId: null,
    });
  }

  /**
   * Monthly late-comer allowance (client-confirmed 2026-08-21).
   *
   * Every employee gets `shift.lateDaysAllowedPerMonth` free late days per calendar month.
   * Late day 1..N are still a full Present; from N+1 onward the day becomes a Half-day.
   *
   * Counts only late days EARLIER in the same month, then adds today — so today's own row
   * (which may already exist from a previous run) can't inflate its own tally.
   *
   * Because the answer depends on earlier days, recomputing a day mid-month can leave later
   * days stale. `recalculateRange` walks dates in ascending order for exactly this reason;
   * after any backdated correction, re-run it for the rest of the month.
   */
  private async exceedsMonthlyLateAllowance(
    employeeId: number,
    date: Date,
    shift: { lateDaysAllowedPerMonth: number } | null | undefined,
  ): Promise<boolean> {
    const allowance = shift?.lateDaysAllowedPerMonth ?? 4;
    const monthStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

    const earlierLateDays = await this.prisma.attendanceDaily.count({
      where: {
        employeeId,
        isLate: true,
        attendanceDate: { gte: monthStart, lt: date },
      },
    });

    return earlierLateDays + 1 > allowance;
  }

  private async upsert(
    employeeId: number,
    date: Date,
    fields: {
      firstIn?: Date;
      lastOut?: Date;
      lateMinutes?: number;
      otMinutes?: number;
      isLate?: boolean;
      status: AttendanceStatus;
      leaveTypeId?: number | null;
    },
  ) {
    await this.prisma.attendanceDaily.upsert({
      where: { employeeId_attendanceDate: { employeeId, attendanceDate: date } },
      create: {
        employeeId,
        attendanceDate: date,
        firstIn: fields.firstIn,
        lastOut: fields.lastOut,
        lateMinutes: fields.lateMinutes ?? 0,
        otMinutes: fields.otMinutes ?? 0,
        isLate: fields.isLate ?? false,
        status: fields.status,
        leaveTypeId: fields.leaveTypeId ?? null,
      },
      update: {
        firstIn: fields.firstIn ?? null,
        lastOut: fields.lastOut ?? null,
        lateMinutes: fields.lateMinutes ?? 0,
        otMinutes: fields.otMinutes ?? 0,
        isLate: fields.isLate ?? false,
        status: fields.status,
        leaveTypeId: fields.leaveTypeId ?? null,
      },
    });
  }

  async computeForAllEmployees(dateStr: string): Promise<void> {
    const employees = await this.prisma.employee.findMany({
      where: { status: "active" },
      select: { employeeId: true },
    });
    for (const emp of employees) {
      await this.computeAttendance(emp.employeeId, dateStr);
    }
  }

  async recalculateRange(
    employeeId: number | undefined,
    fromStr: string,
    toStr: string,
  ): Promise<void> {
    const from = parseDateOnly(fromStr);
    const to = parseDateOnly(toStr);
    const employeeIds = employeeId
      ? [employeeId]
      : (
          await this.prisma.employee.findMany({
            where: { status: "active" },
            select: { employeeId: true },
          })
        ).map((e) => e.employeeId);

    for (const empId of employeeIds) {
      for (let d = new Date(from); d <= to; d = new Date(d.getTime() + 86_400_000)) {
        await this.computeAttendance(empId, d.toISOString().slice(0, 10));
      }
    }
  }

  async getHistory(employeeId: number, fromStr?: string, toStr?: string) {
    return this.prisma.attendanceDaily.findMany({
      where: {
        employeeId,
        attendanceDate: {
          gte: fromStr ? parseDateOnly(fromStr) : undefined,
          lte: toStr ? parseDateOnly(toStr) : undefined,
        },
      },
      include: { leaveType: true },
      orderBy: { attendanceDate: "asc" },
    });
  }

  async getToday() {
    // Company timezone, not UTC — the UTC date is still yesterday until 05:30 IST, which
    // made the "Today's Attendance" dashboard show the wrong day every early morning.
    const date = parseDateOnly(todayDateKey());
    return this.prisma.attendanceDaily.findMany({
      where: { attendanceDate: date },
      include: { employee: { select: { employeeId: true, name: true, employeeCode: true } } },
      orderBy: { firstIn: "asc" },
    });
  }

  async getLateReport(month: number, year: number) {
    const from = parseDateOnly(`${year}-${String(month).padStart(2, "0")}-01`);
    const to = new Date(Date.UTC(year, month, 0)); // last day of month
    return this.prisma.attendanceDaily.findMany({
      where: {
        attendanceDate: { gte: from, lte: to },
        lateMinutes: { gt: 0 },
      },
      include: { employee: { select: { employeeId: true, name: true, employeeCode: true } } },
      orderBy: [{ attendanceDate: "asc" }, { lateMinutes: "desc" }],
    });
  }
}
