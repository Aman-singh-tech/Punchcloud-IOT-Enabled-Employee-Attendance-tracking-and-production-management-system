// Backfills a realistic FULL month of attendance + production history for the two seeded
// demo employees (Asha Rao — fixed-salary, Ravi Kumar — piece-rate). Skips Sundays (weekly
// off). Deliberately covers the whole month, including "future" days relative to today —
// generating payroll mid-month against only a partial backfill would count the remaining
// days as Absent and produce a confusingly low net_pay. A live punch during the demo
// simply overwrites today's already-backfilled record with a fresh timestamp.
//
// Why this exists: a live demo can only show 1-2 real days of activity, but payroll math
// is monthly — without backfilled history, a freshly generated payslip shows tiny,
// confusing numbers (e.g. ₹90) instead of a realistic month total (e.g. ₹1,800+). This
// script exists purely to make demos legible, not as a system feature.
//
// Usage: pnpm ts-node scripts/seed-demo-month.ts [--month=6 --year=2026]
// Defaults to the current month. Pass --month/--year to backfill an earlier month, which is
// how the dashboard's monthly trend chart gets more than one bar to draw.
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/common/prisma.service";
import { AttendanceService } from "../src/modules/attendance/attendance.service";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const attendanceService = app.get(AttendanceService);

  const arg = (name: string) =>
    process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

  const now = new Date();
  const year = Number(arg("year") ?? now.getUTCFullYear());
  const month = Number(arg("month") ?? now.getUTCMonth() + 1); // 1-indexed
  const isCurrentMonth = year === now.getUTCFullYear() && month === now.getUTCMonth() + 1;
  const today = now.getUTCDate();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const ashaEmployeeId = 1;
  const raviEmployeeId = 2;
  const device = await prisma.device.findFirst();
  // Single admin/HR person handles production entry now — no separate Supervisor role.
  const hrUser = await prisma.userAccount.findFirst({
    where: { role: { name: "HR" } },
  });
  if (!device || !hrUser) {
    console.error("Seed a device and an HR user first (pnpm prisma:seed).");
    process.exit(1);
  }

  // One historical paid-leave day and two genuine absences for Asha, spread through the
  // month, so the payslip visibly demonstrates the pro-ration formula actually reducing
  // pay below the full base salary — not just always paying 100%.
  const isSunday = (day: number) => new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 0;
  const nextNonSunday = (day: number) => (isSunday(day) ? day + 1 : day);
  const leaveDay = nextNonSunday(Math.max(3, Math.floor(daysInMonth / 4)));
  const absentDays = [
    nextNonSunday(Math.max(5, Math.floor(daysInMonth / 2))),
    nextNonSunday(Math.max(7, Math.floor((3 * daysInMonth) / 4))),
  ];
  const paidLeaveType = await prisma.leaveType.findFirst({ where: { name: "Paid" } });

  console.log(`Backfilling ${year}-${pad(month)}-01 through ${year}-${pad(month)}-${pad(daysInMonth)}...`);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const dow = date.getUTCDay();
    if (dow === 0) continue; // Sunday — weekly off

    const dateStr = `${year}-${pad(month)}-${pad(day)}`;

    if (absentDays.includes(day)) {
      await prisma.punchLog.deleteMany({
        where: { employeeId: ashaEmployeeId, punchTimestamp: { gte: date, lt: new Date(date.getTime() + 86_400_000) } },
      });
      await prisma.attendanceDaily.upsert({
        where: { employeeId_attendanceDate: { employeeId: ashaEmployeeId, attendanceDate: date } },
        create: { employeeId: ashaEmployeeId, attendanceDate: date, status: "Absent" },
        update: { status: "Absent", firstIn: null, lastOut: null, leaveTypeId: null },
      });
    } else if (day === leaveDay && paidLeaveType) {
      await prisma.attendanceDaily.upsert({
        where: { employeeId_attendanceDate: { employeeId: ashaEmployeeId, attendanceDate: date } },
        create: {
          employeeId: ashaEmployeeId,
          attendanceDate: date,
          status: "On Leave",
          leaveTypeId: paidLeaveType.leaveTypeId,
        },
        update: { status: "On Leave", leaveTypeId: paidLeaveType.leaveTypeId },
      });
    } else {
      // Asha: present most days, occasionally a few minutes late.
      const lateMin = day % 5 === 0 ? 12 : 0;
      const inHour = 9;
      const inMin = Math.min(59, lateMin);
      await prisma.punchLog.upsert({
        where: {
          employeeId_punchTimestamp: {
            employeeId: ashaEmployeeId,
            punchTimestamp: new Date(Date.UTC(year, month - 1, day, inHour, inMin, 0)),
          },
        },
        create: {
          employeeId: ashaEmployeeId,
          deviceId: device.deviceId,
          punchTimestamp: new Date(Date.UTC(year, month - 1, day, inHour, inMin, 0)),
          direction: "IN",
        },
        update: {},
      });
      await prisma.punchLog.upsert({
        where: {
          employeeId_punchTimestamp: {
            employeeId: ashaEmployeeId,
            punchTimestamp: new Date(Date.UTC(year, month - 1, day, 18, 10, 0)),
          },
        },
        create: {
          employeeId: ashaEmployeeId,
          deviceId: device.deviceId,
          punchTimestamp: new Date(Date.UTC(year, month - 1, day, 18, 10, 0)),
          direction: "OUT",
        },
        update: {},
      });
      await attendanceService.computeAttendance(ashaEmployeeId, dateStr);
    }

    // Ravi: a production entry every working day, ~88-95% acceptance rate.
    const produced = 90 + (day % 7) * 5;
    const rejected = 5 + (day % 4);
    const accepted = produced - rejected;
    await prisma.productionEntry.upsert({
      where: { employeeId_entryDate: { employeeId: raviEmployeeId, entryDate: date } },
      create: {
        employeeId: raviEmployeeId,
        entryDate: date,
        recordsProduced: produced,
        recordsAccepted: accepted,
        recordsRejected: rejected,
        submittedBy: hrUser.userId,
      },
      update: {
        recordsProduced: produced,
        recordsAccepted: accepted,
        recordsRejected: rejected,
      },
    });
  }

  const ravSummary = await prisma.productionEntry.aggregate({
    where: { employeeId: raviEmployeeId, entryDate: { gte: new Date(Date.UTC(year, month - 1, 1)) } },
    _sum: { recordsAccepted: true },
  });
  console.log(`Done. Ravi's accumulated accepted pieces for the month: ${ravSummary._sum.recordsAccepted}`);
  console.log(`Asha has 1 paid-leave day (day ${leaveDay}) and present days for the rest of the month.`);
  if (isCurrentMonth) {
    console.log(`Today (day ${today}) already has a backfilled punch — punch again live during the demo to overwrite it with a fresh timestamp.`);
  }

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
