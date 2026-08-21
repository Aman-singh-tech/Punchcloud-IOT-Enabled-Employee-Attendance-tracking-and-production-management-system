// The two confirmed pay paths, as pure functions — deliberately free of any DB/Prisma
// dependency so they can be unit-tested directly against the Formulas doc's own examples.
// Non-Negotiable Rules (do not change without re-confirming with the client):
//   1. Every employee is exactly one of piece_rate | fixed_salary. No third type.
//   2. Piece-rate: net_pay = total_accepted_pieces * per_record_rate. Nothing else — not
//      attendance, not leave (paid or unpaid), not lateness, not OT. Pieces produced by a
//      fixed_salary employee never enter anyone's pay; they only roll up into the company's
//      total production report.
//   3. Fixed-salary: net_pay = (payable_days / working_days) * monthly_base_salary, where
//      payable_days = full present days + 0.5 * half-days. Days actually worked are the ONLY
//      input.
//   4. Nobody is paid overtime — not piece-rate, not fixed-salary (client re-confirmed
//      2026-08-21: fixed-salary staff don't work OT at this company at all). OT minutes are
//      still computed from punches and shown on reports/payslips, but they are structurally
//      incapable of reaching net_pay: neither function below takes an OT parameter.
//   5. There is NO paid leave at this company (client-confirmed 2026-08-21). Leave is still
//      requested/approved and recorded, but a leave day is simply not a present day, so it
//      is not paid. `days_on_paid_leave` deliberately does not appear below.

export function calculatePieceRateNetPay(totalAccepted: number, perRecordRate: number): number {
  return round2(totalAccepted * perRecordRate);
}

/** A half-day earns half of what a full present day earns. */
export const HALF_DAY_WEIGHT = 0.5;

export function calculatePayableDays(daysPresent: number, daysHalfDay: number): number {
  return daysPresent + HALF_DAY_WEIGHT * daysHalfDay;
}

export function calculateFixedSalaryNetPay(
  payableDays: number,
  workingDays: number,
  monthlyBaseSalary: number,
): number {
  if (workingDays <= 0) {
    // No working days in the period to prorate against — nothing earnable.
    return 0;
  }
  return round2((payableDays / workingDays) * monthlyBaseSalary);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
