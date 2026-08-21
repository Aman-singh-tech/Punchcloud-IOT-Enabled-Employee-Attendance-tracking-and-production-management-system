import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { parseDateOnly, todayDateKey } from "../../common/utils/wall-clock.util";

export interface MonthSummary {
  month: number;
  year: number;
  label: string;
  totalProduced: number;
  totalAccepted: number;
  totalRejected: number;
  rejectionRate: number;
  totalNetPay: number;
  payrollRecordCount: number;
  payrollFinalized: boolean;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Powers the HR dashboard's monthly trend. Deliberately ONE endpoint returning every month
// at once — the alternative (the frontend looping over /production/report and /payroll per
// month) is 2N round-trips for a screen that loads on every login.
@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(monthsBack = 6) {
    const today = todayDateKey();
    const [currentYear, currentMonth] = today.split("-").map(Number);

    // Oldest month first, so the chart reads left-to-right as time moving forward.
    const periods: { month: number; year: number }[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(currentYear, currentMonth - 1 - i, 1));
      periods.push({ month: d.getUTCMonth() + 1, year: d.getUTCFullYear() });
    }

    const rangeStart = parseDateOnly(
      `${periods[0].year}-${String(periods[0].month).padStart(2, "0")}-01`,
    );
    const rangeEnd = new Date(Date.UTC(currentYear, currentMonth, 0)); // last day of this month

    const [production, payroll, activeEmployees, todayRows] = await Promise.all([
      this.prisma.productionEntry.findMany({
        where: { entryDate: { gte: rangeStart, lte: rangeEnd } },
        select: {
          entryDate: true,
          recordsProduced: true,
          recordsAccepted: true,
          recordsRejected: true,
        },
      }),
      this.prisma.payrollRecord.findMany({
        where: { year: { in: [...new Set(periods.map((p) => p.year))] } },
        select: { month: true, year: true, netPay: true, status: true },
      }),
      this.prisma.employee.count({ where: { status: "active" } }),
      this.prisma.attendanceDaily.findMany({
        where: { attendanceDate: parseDateOnly(today) },
        select: { status: true },
      }),
    ]);

    const months: MonthSummary[] = periods.map(({ month, year }) => {
      const prod = production.filter(
        (e) =>
          e.entryDate.getUTCFullYear() === year && e.entryDate.getUTCMonth() + 1 === month,
      );
      const totalProduced = prod.reduce((s, e) => s + e.recordsProduced, 0);
      const totalAccepted = prod.reduce((s, e) => s + e.recordsAccepted, 0);
      const totalRejected = prod.reduce((s, e) => s + e.recordsRejected, 0);

      const pay = payroll.filter((r) => r.month === month && r.year === year);
      const totalNetPay = pay.reduce((s, r) => s + Number(r.netPay ?? 0), 0);

      return {
        month,
        year,
        label: `${MONTH_LABELS[month - 1]} ${year}`,
        totalProduced,
        totalAccepted,
        totalRejected,
        rejectionRate: totalProduced > 0 ? (totalRejected / totalProduced) * 100 : 0,
        totalNetPay: Math.round(totalNetPay * 100) / 100,
        payrollRecordCount: pay.length,
        // "Locked in" only once every record for the month has left draft.
        payrollFinalized:
          pay.length > 0 && pay.every((r) => r.status === "finalized" || r.status === "paid"),
      };
    });

    const tally = { Present: 0, "Half-day": 0, Absent: 0, "On Leave": 0, Off: 0 };
    for (const row of todayRows) {
      if (row.status && row.status in tally) {
        tally[row.status as keyof typeof tally]++;
      }
    }

    return {
      today: {
        date: today,
        present: tally.Present,
        halfDay: tally["Half-day"],
        absent: tally.Absent,
        onLeave: tally["On Leave"],
        off: tally.Off,
        // Active employees with no attendance row yet — the day is still in progress.
        awaiting: Math.max(0, activeEmployees - todayRows.length),
      },
      activeEmployees,
      months,
    };
  }
}
