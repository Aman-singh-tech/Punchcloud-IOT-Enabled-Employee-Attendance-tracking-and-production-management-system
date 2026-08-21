import { PayrollService } from "../src/modules/payroll/payroll.service";

// Integration-style test of PayrollService.generatePayroll against mocked Prisma/S3/
// SalaryStructureRepository/PDF collaborators — exercises the full branch selection
// (Rule #1: exactly two paths) and the mid-month salary-structure-change scenario that
// depends on effective_from/effective_to, which the pure calculation spec can't cover.

function buildPrismaMock(overrides: Partial<Record<string, any>> = {}) {
  return {
    employee: {
      findUnique: jest.fn().mockResolvedValue({
        employeeId: 1,
        name: "Test Employee",
        employeeCode: "EMP-0001",
        designation: "Data Entry Operator",
        locationId: 1,
        shift: { weeklyOffDays: [0] },
      }),
    },
    attendanceDaily: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    productionEntry: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    holidayCalendar: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    payrollRecord: {
      upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ payrollId: 1n, ...create })),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    ...overrides,
  };
}

const s3Mock = { putBuffer: jest.fn().mockResolvedValue("key"), getSignedDownloadUrl: jest.fn() };
const pdfMock = { render: jest.fn().mockResolvedValue(Buffer.from("pdf")) };

describe("PayrollService.generatePayroll", () => {
  afterEach(() => jest.clearAllMocks());

  it("Path A (piece_rate): net_pay = total_accepted * per_record_rate, ignores attendance entirely", async () => {
    const prisma = buildPrismaMock({
      productionEntry: {
        findMany: jest.fn().mockResolvedValue([
          { recordsProduced: 500, recordsAccepted: 450, recordsRejected: 50 },
          { recordsProduced: 500, recordsAccepted: 450, recordsRejected: 50 },
        ]),
      },
      attendanceDaily: {
        // Employee was absent most of the month — must have zero effect on piece-rate pay.
        findMany: jest.fn().mockResolvedValue([
          { status: "Absent", lateMinutes: 0, otMinutes: 0, leaveType: null },
        ]),
      },
    });
    const salaryStructures = {
      getActiveAsOf: jest.fn().mockResolvedValue({
        employeeType: "piece_rate",
        perRecordRate: 1,
        monthlyBaseSalary: null,
      }),
    };
    const service = new PayrollService(prisma as any, s3Mock as any, salaryStructures as any, pdfMock as any);

    const record = await service.generatePayroll(1, 8, 2026);

    expect(record.netPay).toBe(900); // 900 accepted * Rs.1
    expect(record.employeeType).toBe("piece_rate");
  });

  it("Path A: zero production => net_pay = 0, no crash", async () => {
    const prisma = buildPrismaMock();
    const salaryStructures = {
      getActiveAsOf: jest.fn().mockResolvedValue({ employeeType: "piece_rate", perRecordRate: 2, monthlyBaseSalary: null }),
    };
    const service = new PayrollService(prisma as any, s3Mock as any, salaryStructures as any, pdfMock as any);

    const record = await service.generatePayroll(1, 8, 2026);
    expect(record.netPay).toBe(0);
  });

  it("Path B (fixed_salary): net_pay = (present/workingDays) * baseSalary", async () => {
    const prisma = buildPrismaMock({
      attendanceDaily: {
        findMany: jest.fn().mockResolvedValue(
          Array(22).fill({ status: "Present", lateMinutes: 0, otMinutes: 0, leaveType: null }),
        ),
      },
    });
    // August 2026 has 31 days; with weeklyOffDays=[0] (Sundays) there are 5 Sundays
    // (2,9,16,23,30) => working_days = 31-5 = 26.
    const salaryStructures = {
      getActiveAsOf: jest.fn().mockResolvedValue({
        employeeType: "fixed_salary",
        perRecordRate: null,
        monthlyBaseSalary: 20000,
      }),
    };
    const service = new PayrollService(prisma as any, s3Mock as any, salaryStructures as any, pdfMock as any);

    const record = await service.generatePayroll(1, 8, 2026);
    expect(record.workingDays).toBe(26);
    expect(record.netPay).toBeCloseTo((22 / 26) * 20000, 2);
  });

  it("Path B: an approved leave day is NOT paid — this company has no paid leave", async () => {
    // Same 22 present days as above, plus 3 approved *paid-type* leave days. The net pay must
    // be identical to the run without them: leave never adds money, whatever its leave_type
    // says, because a leave day is simply not a day worked.
    const prisma = buildPrismaMock({
      attendanceDaily: {
        findMany: jest.fn().mockResolvedValue([
          ...Array(22).fill({ status: "Present", lateMinutes: 0, otMinutes: 0, leaveType: null }),
          ...Array(3).fill({ status: "On Leave", lateMinutes: 0, otMinutes: 0, leaveType: { isPaid: true } }),
        ]),
      },
    });
    const salaryStructures = {
      getActiveAsOf: jest.fn().mockResolvedValue({
        employeeType: "fixed_salary",
        perRecordRate: null,
        monthlyBaseSalary: 20000,
      }),
    };
    const service = new PayrollService(prisma as any, s3Mock as any, salaryStructures as any, pdfMock as any);

    const record = await service.generatePayroll(1, 8, 2026);
    expect(record.daysOnPaidLeave).toBe(3); // still recorded for HR's reports
    expect(record.netPay).toBeCloseTo((22 / 26) * 20000, 2); // but worth nothing
  });

  it("Path B: zero days present => net_pay = 0, not an error", async () => {
    const prisma = buildPrismaMock({
      attendanceDaily: {
        findMany: jest.fn().mockResolvedValue(Array(26).fill({ status: "Absent", lateMinutes: 0, otMinutes: 0, leaveType: null })),
      },
    });
    const salaryStructures = {
      getActiveAsOf: jest.fn().mockResolvedValue({ employeeType: "fixed_salary", perRecordRate: null, monthlyBaseSalary: 20000 }),
    };
    const service = new PayrollService(prisma as any, s3Mock as any, salaryStructures as any, pdfMock as any);

    const record = await service.generatePayroll(1, 8, 2026);
    expect(record.netPay).toBe(0);
  });

  it("Path B: OT minutes are recorded on the payslip but never enter net_pay", async () => {
    const prisma = buildPrismaMock({
      attendanceDaily: {
        findMany: jest.fn().mockResolvedValue(
          // 25 days present with 2h OT each — 3000 OT minutes that must be worth nothing
          Array(25).fill({ status: "Present", lateMinutes: 0, otMinutes: 120, leaveType: null }),
        ),
      },
    });
    const salaryStructures = {
      getActiveAsOf: jest.fn().mockResolvedValue({ employeeType: "fixed_salary", perRecordRate: null, monthlyBaseSalary: 20000 }),
    };
    const service = new PayrollService(prisma as any, s3Mock as any, salaryStructures as any, pdfMock as any);

    // working_days = 31 - 5 Sundays = 26
    const withoutOt = calculateExpected(25, 26, 20000);
    const record = await service.generatePayroll(1, 8, 2026);

    expect(record.totalOtMinutes).toBe(25 * 120); // stored/reported
    expect(Number(record.netPay)).toBeCloseTo(withoutOt, 2); // but excluded from net_pay
  });

  it("Path A: OT is NEVER paid to a piece-rate employee, no matter how many OT minutes", async () => {
    const prisma = buildPrismaMock({
      attendanceDaily: {
        findMany: jest.fn().mockResolvedValue(
          Array(25).fill({ status: "Present", lateMinutes: 0, otMinutes: 240, leaveType: null }),
        ),
      },
      productionEntry: {
        findMany: jest.fn().mockResolvedValue([
          { recordsProduced: 500, recordsAccepted: 400, recordsRejected: 100 },
        ]),
      },
    });
    const salaryStructures = {
      getActiveAsOf: jest.fn().mockResolvedValue({ employeeType: "piece_rate", perRecordRate: 2, monthlyBaseSalary: null }),
    };
    const service = new PayrollService(prisma as any, s3Mock as any, salaryStructures as any, pdfMock as any);

    const record = await service.generatePayroll(1, 8, 2026);

    expect(record.totalOtMinutes).toBe(25 * 240); // recorded for HR's information
    expect(Number(record.netPay)).toBe(800); // exactly 400 accepted * Rs.2, nothing for OT
  });

  it("Path B: weekly offs are excluded from working_days, so Sundays never cost salary", async () => {
    // A full month worked: 26 present days + the month's 5 Sundays as "Off". working_days is
    // 31 - 5 = 26, so this employee earns their full salary and the Off days are not absences.
    const prisma = buildPrismaMock({
      attendanceDaily: {
        findMany: jest.fn().mockResolvedValue([
          ...Array(26).fill({ status: "Present", lateMinutes: 0, otMinutes: 0, leaveType: null }),
          ...Array(5).fill({ status: "Off", lateMinutes: 0, otMinutes: 0, leaveType: null }),
        ]),
      },
    });
    const salaryStructures = {
      getActiveAsOf: jest.fn().mockResolvedValue({ employeeType: "fixed_salary", perRecordRate: null, monthlyBaseSalary: 20000 }),
    };
    const service = new PayrollService(prisma as any, s3Mock as any, salaryStructures as any, pdfMock as any);

    const record = await service.generatePayroll(1, 8, 2026);

    expect(record.workingDays).toBe(26);
    expect(record.daysOff).toBe(5);
    expect(record.daysAbsent).toBe(0); // an Off day is never an absence
    expect(Number(record.netPay)).toBe(20000); // full salary
  });

  it("uses the salary structure active as of the payroll month (effective_from/effective_to), not whatever is 'current'", async () => {
    const prisma = buildPrismaMock();
    // Simulates a mid-month promotion: getActiveAsOf is what SalaryStructureRepository
    // resolves via effective_from/effective_to — this test asserts generatePayroll asks
    // for the structure active as of the *payroll period's* last day, not "now".
    const getActiveAsOf = jest.fn().mockResolvedValue({
      employeeType: "fixed_salary",
      perRecordRate: null,
      monthlyBaseSalary: 15000, // the OLD rate that was active during August
    });
    const salaryStructures = { getActiveAsOf };
    const service = new PayrollService(prisma as any, s3Mock as any, salaryStructures as any, pdfMock as any);

    await service.generatePayroll(1, 8, 2026);

    const asOfArg: Date = getActiveAsOf.mock.calls[0][1];
    expect(asOfArg.getUTCFullYear()).toBe(2026);
    expect(asOfArg.getUTCMonth()).toBe(7); // August, 0-indexed
    expect(asOfArg.getUTCDate()).toBe(31); // last day of the payroll month
  });

  it("Path B: a festival holiday shrinks working_days, so Diwali costs the employee nothing", async () => {
    // Aug 2026: 31 days, 5 Sundays => 26 workdays. One festival holiday on Tue 18 Aug leaves
    // 25 actual workdays. An employee present all 25 must still earn the full salary.
    const prisma = buildPrismaMock({
      attendanceDaily: {
        findMany: jest.fn().mockResolvedValue([
          ...Array(25).fill({ status: "Present", lateMinutes: 0, otMinutes: 0, leaveType: null }),
          ...Array(6).fill({ status: "Off", lateMinutes: 0, otMinutes: 0, leaveType: null }),
        ]),
      },
      holidayCalendar: {
        findMany: jest.fn().mockResolvedValue([{ holidayDate: new Date(Date.UTC(2026, 7, 18)) }]),
      },
    });
    const salaryStructures = {
      getActiveAsOf: jest.fn().mockResolvedValue({ employeeType: "fixed_salary", perRecordRate: null, monthlyBaseSalary: 20000 }),
    };
    const service = new PayrollService(prisma as any, s3Mock as any, salaryStructures as any, pdfMock as any);

    const record = await service.generatePayroll(1, 8, 2026);

    expect(record.workingDays).toBe(25); // 31 - 5 Sundays - 1 festival
    expect(Number(record.netPay)).toBe(20000); // full salary on 25 present days
  });

  it("Path B: a festival that FALLS ON a Sunday is not subtracted twice", async () => {
    // Aug 2026: Sundays are 2, 9, 16, 23, 30. Put the festival on Sunday 16 Aug. It is
    // already outside working_days as a weekly off, so working_days must stay 26 — not 25.
    // Subtracting twice would pay a fully-present employee MORE than their salary.
    const prisma = buildPrismaMock({
      attendanceDaily: {
        findMany: jest.fn().mockResolvedValue([
          ...Array(26).fill({ status: "Present", lateMinutes: 0, otMinutes: 0, leaveType: null }),
          ...Array(5).fill({ status: "Off", lateMinutes: 0, otMinutes: 0, leaveType: null }),
        ]),
      },
      holidayCalendar: {
        findMany: jest.fn().mockResolvedValue([{ holidayDate: new Date(Date.UTC(2026, 7, 16)) }]),
      },
    });
    const salaryStructures = {
      getActiveAsOf: jest.fn().mockResolvedValue({ employeeType: "fixed_salary", perRecordRate: null, monthlyBaseSalary: 20000 }),
    };
    const service = new PayrollService(prisma as any, s3Mock as any, salaryStructures as any, pdfMock as any);

    const record = await service.generatePayroll(1, 8, 2026);

    expect(record.workingDays).toBe(26);
    expect(Number(record.netPay)).toBe(20000); // exactly the salary, never more
  });

  it("Path A: festival holidays do not touch piece-rate pay at all", async () => {
    const prisma = buildPrismaMock({
      productionEntry: {
        findMany: jest.fn().mockResolvedValue([
          { recordsProduced: 500, recordsAccepted: 400, recordsRejected: 100 },
        ]),
      },
      holidayCalendar: {
        findMany: jest.fn().mockResolvedValue([{ holidayDate: new Date(Date.UTC(2026, 7, 18)) }]),
      },
    });
    const salaryStructures = {
      getActiveAsOf: jest.fn().mockResolvedValue({ employeeType: "piece_rate", perRecordRate: 2, monthlyBaseSalary: null }),
    };
    const service = new PayrollService(prisma as any, s3Mock as any, salaryStructures as any, pdfMock as any);

    const record = await service.generatePayroll(1, 8, 2026);
    expect(record.workingDays).toBeNull();
    expect(Number(record.netPay)).toBe(800); // 400 accepted x Rs.2
  });

  it("throws a clear error if no salary structure is active for the period, instead of paying a wrong amount", async () => {
    const prisma = buildPrismaMock();
    const salaryStructures = { getActiveAsOf: jest.fn().mockResolvedValue(null) };
    const service = new PayrollService(prisma as any, s3Mock as any, salaryStructures as any, pdfMock as any);

    await expect(service.generatePayroll(1, 8, 2026)).rejects.toThrow();
  });
});

function calculateExpected(present: number, workingDays: number, base: number): number {
  return Math.round((present / workingDays) * base * 100) / 100;
}
