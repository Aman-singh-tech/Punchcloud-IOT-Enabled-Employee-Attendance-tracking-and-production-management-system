import { AttendanceService } from "../src/modules/attendance/attendance.service";

// The monthly late-comer allowance (client-confirmed 2026-08-21):
//   Arriving more than 15 minutes after shift start marks the day late.
//   The first 4 late days in a calendar month are forgiven — still a full Present.
//   The 5th late day onward is downgraded to Half-day, which is worth 0.5 of a day's pay.
//
// Shift used throughout: 09:00–18:00, 10 min grace (reporting only), 15 min late threshold,
// 4 free late days per month.

const SHIFT = {
  startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
  endTime: new Date(Date.UTC(1970, 0, 1, 18, 0, 0)),
  gracePeriodMinutes: 10,
  standardHours: 8,
  weeklyOffDays: [0],
  lateThresholdMinutes: 15,
  lateDaysAllowedPerMonth: 4,
};

/** Builds a mocked Prisma where the employee punched in at `inTime` and out at 18:00. */
function buildPrisma(opts: {
  inTime: string;
  outTime?: string | null;
  earlierLateDays?: number;
  festivalHoliday?: { holidayId: number } | null;
}) {
  const punch = (t: string) => ({ punchTimestamp: new Date(`${t}Z`) });
  const punches = [punch(opts.inTime)];
  if (opts.outTime !== null) {
    punches.push(punch(opts.outTime ?? "2026-08-10T18:00:00"));
  }

  const upsert = jest.fn().mockResolvedValue({});
  return {
    upsert,
    prisma: {
      attendanceDaily: {
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(opts.earlierLateDays ?? 0),
        upsert,
      },
      punchLog: { findMany: jest.fn().mockResolvedValue(punches) },
      employee: {
        findUnique: jest.fn().mockResolvedValue({ employeeId: 1, locationId: 1, shift: SHIFT }),
      },
      leaveRequest: { findFirst: jest.fn().mockResolvedValue(null) },
      holidayCalendar: { findFirst: jest.fn().mockResolvedValue(opts.festivalHoliday ?? null) },
    },
  };
}

async function run(opts: Parameters<typeof buildPrisma>[0], dateStr = "2026-08-10") {
  const { prisma, upsert } = buildPrisma(opts);
  const service = new AttendanceService(prisma as any);
  await service.computeAttendance(1, dateStr);
  return upsert.mock.calls[0][0].create;
}

describe("late threshold — what counts as a late day", () => {
  it("on time => not late, Present", async () => {
    const r = await run({ inTime: "2026-08-10T09:00:00" });
    expect(r.isLate).toBe(false);
    expect(r.status).toBe("Present");
  });

  it("10 minutes late is inside the 15-minute threshold => not a late day", async () => {
    const r = await run({ inTime: "2026-08-10T09:10:00" });
    expect(r.isLate).toBe(false);
    expect(r.status).toBe("Present");
  });

  it("exactly 15 minutes late is still NOT late — the rule is *more than* 15", async () => {
    const r = await run({ inTime: "2026-08-10T09:15:00" });
    expect(r.isLate).toBe(false);
  });

  it("16 minutes late => a late day", async () => {
    const r = await run({ inTime: "2026-08-10T09:16:00" });
    expect(r.isLate).toBe(true);
  });

  it("the threshold is measured from shift start, not from the grace period", async () => {
    // Grace is 10 min and the threshold is 15 min. If the two were stacked the cutoff would
    // be 09:25 and this 09:20 arrival would not be late. It must be late.
    const r = await run({ inTime: "2026-08-10T09:20:00" });
    expect(r.isLate).toBe(true);
  });
});

describe("monthly allowance — when a late day becomes a Half-day", () => {
  it("1st late day of the month => still full Present", async () => {
    const r = await run({ inTime: "2026-08-10T10:00:00", earlierLateDays: 0 });
    expect(r.isLate).toBe(true);
    expect(r.status).toBe("Present");
  });

  it("4th late day of the month => still full Present (4 are allowed)", async () => {
    const r = await run({ inTime: "2026-08-10T10:00:00", earlierLateDays: 3 });
    expect(r.status).toBe("Present");
  });

  it("5th late day of the month => Half-day", async () => {
    const r = await run({ inTime: "2026-08-10T10:00:00", earlierLateDays: 4 });
    expect(r.isLate).toBe(true);
    expect(r.status).toBe("Half-day");
  });

  it("every late day after the 5th is also a Half-day", async () => {
    const r = await run({ inTime: "2026-08-10T10:00:00", earlierLateDays: 12 });
    expect(r.status).toBe("Half-day");
  });

  it("an on-time day is Present even after the allowance is used up", async () => {
    const r = await run({ inTime: "2026-08-10T09:00:00", earlierLateDays: 9 });
    expect(r.isLate).toBe(false);
    expect(r.status).toBe("Present");
  });

  it("only late days EARLIER in the month are counted, never the day itself", async () => {
    const { prisma } = buildPrisma({ inTime: "2026-08-10T10:00:00" });
    const service = new AttendanceService(prisma as any);
    await service.computeAttendance(1, "2026-08-10");

    const where = prisma.attendanceDaily.count.mock.calls[0][0].where;
    expect(where.isLate).toBe(true);
    expect(where.attendanceDate.gte).toEqual(new Date(Date.UTC(2026, 7, 1)));
    expect(where.attendanceDate.lt).toEqual(new Date(Date.UTC(2026, 7, 10)));
  });
});

describe("interaction with the forgot-to-punch-out rule", () => {
  it("a single punch is a Half-day even when the employee arrived on time", async () => {
    const r = await run({ inTime: "2026-08-10T09:00:00", outTime: null });
    expect(r.status).toBe("Half-day");
    expect(r.isLate).toBe(false);
  });

  it("a single punch that was also late is still recorded as late", async () => {
    const r = await run({ inTime: "2026-08-10T10:00:00", outTime: null, earlierLateDays: 0 });
    expect(r.status).toBe("Half-day");
    expect(r.isLate).toBe(true); // counts toward next month-day's allowance tally
  });
});

describe("off days win over punches — working an off day earns nothing extra", () => {
  // 16 Aug 2026 is a Sunday; the mock shift's weekly off is [0] = Sunday.
  const SUNDAY = "2026-08-16";

  it("a full day worked on a Sunday is still Off, not Present", async () => {
    const r = await run({ inTime: "2026-08-16T09:00:00", outTime: "2026-08-16T18:00:00" }, SUNDAY);
    expect(r.status).toBe("Off");
  });

  it("the Sunday punches are still recorded, so HR can see who came in", async () => {
    const r = await run({ inTime: "2026-08-16T09:00:00", outTime: "2026-08-16T18:00:00" }, SUNDAY);
    expect(r.firstIn).toEqual(new Date("2026-08-16T09:00:00Z"));
    expect(r.lastOut).toEqual(new Date("2026-08-16T18:00:00Z"));
  });

  it("no late/OT figures are recorded for an off day", async () => {
    // Arrived 2h late and left 2h after shift end — neither should register.
    const r = await run({ inTime: "2026-08-16T11:00:00", outTime: "2026-08-16T20:00:00" }, SUNDAY);
    expect(r.lateMinutes).toBe(0);
    expect(r.otMinutes).toBe(0);
    expect(r.isLate).toBe(false);
  });

  it("arriving late on an off day never eats into the monthly late allowance", async () => {
    const { prisma } = buildPrisma({ inTime: "2026-08-16T11:00:00" });
    const service = new AttendanceService(prisma as any);
    await service.computeAttendance(1, SUNDAY);
    // The allowance is never even consulted for an off day.
    expect(prisma.attendanceDaily.count).not.toHaveBeenCalled();
  });

  it("a festival holiday beats punches too, on an ordinary weekday", async () => {
    const r = await run({
      inTime: "2026-08-10T09:00:00",
      outTime: "2026-08-10T18:00:00",
      festivalHoliday: { holidayId: 1 },
    });
    expect(r.status).toBe("Off");
  });

  it("without a festival holiday the same weekday is a normal Present", async () => {
    const r = await run({ inTime: "2026-08-10T09:00:00", outTime: "2026-08-10T18:00:00" });
    expect(r.status).toBe("Present");
  });
});
