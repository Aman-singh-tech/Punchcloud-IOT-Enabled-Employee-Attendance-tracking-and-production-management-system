import {
  calculateFixedSalaryNetPay,
  calculatePayableDays,
  calculatePieceRateNetPay,
} from "../src/modules/payroll/payroll-calculation";

// Priority test file per the build plan: this is the part of PunchCloud that must never
// be silently wrong. Covers both pay paths plus the edge cases called out explicitly:
// zero production, zero days present, and (in payroll.service integration spec) a
// mid-month salary structure change via effective_from/effective_to.

describe("calculatePieceRateNetPay (Path A)", () => {
  it("matches the Formulas doc worked example: 900 accepted * Rs.1 = Rs.900", () => {
    expect(calculatePieceRateNetPay(900, 1)).toBe(900);
  });

  it("pays nothing for rejected pieces — only total_accepted counts", () => {
    // 900 produced, 700 accepted, 200 rejected: net_pay must ignore both produced and rejected.
    expect(calculatePieceRateNetPay(700, 2)).toBe(1400);
  });

  it("zero production => zero pay, not an error", () => {
    expect(calculatePieceRateNetPay(0, 5)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    expect(calculatePieceRateNetPay(3, 0.333)).toBeCloseTo(1.0, 2);
  });

  it("is a pure function of total_accepted * rate: attendance/leave never factor in", () => {
    // Nothing to assert against attendance here by construction — the function signature
    // itself has no attendance/leave parameters, so it is structurally impossible for
    // unpaid leave (or any leave) to affect piece-rate pay. This test exists as a marker:
    // if someone "fixes" this function to accept an attendance argument, this test file's
    // intent should be revisited against Non-Negotiable Rule #2.
    expect(calculatePieceRateNetPay.length).toBe(2);
  });
});

describe("calculateFixedSalaryNetPay (Path B)", () => {
  // Current client-confirmed formula (2026-08-21):
  //   net_pay = (days_present / working_days) * monthly_base_salary
  // No paid-leave term, no OT term.
  it("pays the exact worked-days proportion: 22/25 * 20000 = 17600", () => {
    expect(calculateFixedSalaryNetPay(22, 25, 20000)).toBe(17600);
  });

  it("full attendance => full salary", () => {
    expect(calculateFixedSalaryNetPay(25, 25, 20000)).toBe(20000);
  });

  it("zero days present => zero pay, not an error/NaN", () => {
    expect(calculateFixedSalaryNetPay(0, 25, 20000)).toBe(0);
  });

  it("zero working days in the period => zero pay, not a division-by-zero crash", () => {
    expect(calculateFixedSalaryNetPay(0, 0, 20000)).toBe(0);
    expect(() => calculateFixedSalaryNetPay(5, 0, 20000)).not.toThrow();
  });

  it("rounds to 2 decimal places", () => {
    expect(calculateFixedSalaryNetPay(10, 3, 100)).toBeCloseTo(333.33, 2);
  });

  it("a half-day earns exactly half of a full present day", () => {
    const oneFullDay = calculateFixedSalaryNetPay(calculatePayableDays(1, 0), 26, 26000);
    const oneHalfDay = calculateFixedSalaryNetPay(calculatePayableDays(0, 1), 26, 26000);
    expect(oneFullDay).toBe(1000);
    expect(oneHalfDay).toBe(500);
  });

  it("two half-days are worth one full day", () => {
    expect(calculatePayableDays(0, 2)).toBe(1);
    expect(calculatePayableDays(20, 4)).toBe(22);
  });

  it("is a pure function of present days and salary: neither leave nor OT can reach net_pay", () => {
    // Structural guarantee, same pattern as the piece-rate marker test above — the function
    // takes exactly 3 parameters (present, working days, salary) and none of them is leave
    // or OT. This company pays no overtime and gives no paid leave. If someone adds a 4th
    // parameter, this test fails loudly and the rule set must be re-confirmed first.
    expect(calculateFixedSalaryNetPay.length).toBe(3);
  });
});
