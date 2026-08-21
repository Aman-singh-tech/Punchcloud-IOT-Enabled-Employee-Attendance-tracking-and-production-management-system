import { EmployeeType } from "./employee";

// Mirrors payroll_record. net_pay is the single final figure — no gross-to-net
// breakdown to render, since there are no deductions (Formulas doc Section 5).
export interface PayrollRecord {
  payrollId: string;
  employeeId: number;
  month: number;
  year: number;
  employeeType: EmployeeType;

  daysPresent: number | null; // full days only
  daysHalfDay: number | null; // each worth 0.5 of a payable day
  daysLate: number | null; // late arrivals in the month, incl. the forgiven ones
  daysAbsent: number | null;
  daysOnPaidLeave: number | null;
  daysOnUnpaidLeave: number | null;
  // Leave days are recorded but never paid — this company has no paid leave.
  daysOff: number | null; // weekly offs — excluded from workingDays, so they never deduct
  workingDays: number | null; // total days in month − weekly offs; the fixed-salary denominator
  totalLateMinutes: number | null;
  totalOtMinutes: number | null; // informational only — never part of netPay, for either type

  totalProduced: number | null;
  totalAccepted: number | null;
  totalRejected: number | null;

  netPay: number;
  reportS3Key: string | null;
  downloadUrl?: string | null;
  generatedAt: string;
  status: "draft" | "finalized" | "paid";
}
