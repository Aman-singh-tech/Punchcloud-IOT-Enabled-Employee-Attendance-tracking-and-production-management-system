// working_days = total_days_in_month − weekly_off_days − festival_holidays
//
// Client-confirmed 2026-08-21. The company observes exactly two festival holidays a year
// (Diwali and Holi); on those days the office is shut and the day is treated exactly like a
// Sunday — outside working_days, so a fixed-salary employee is never docked for it, and
// irrelevant to a piece-rate employee (no pieces that day = no pay, automatically).
//
// IMPORTANT: `festivalHolidayCount` must already EXCLUDE any holiday that falls on a weekly
// off. Diwali and Holi move every year and can land on a Sunday; subtracting such a day twice
// would shrink the denominator below the real number of workdays and pay a fully-present
// employee MORE than their monthly salary. `PayrollService.countFestivalHolidaysInMonth` does
// that de-duplication — do not pass a raw `holiday_calendar` row count in here.
//
// Piece-rate employees are unaffected by any of this — working_days never enters their pay.
export function daysInMonth(month: number, year: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function countWeeklyOffDaysInMonth(
  month: number,
  year: number,
  weeklyOffDays: number[],
): number {
  const total = daysInMonth(month, year);
  let count = 0;
  for (let day = 1; day <= total; day++) {
    const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (weeklyOffDays.includes(dow)) {
      count++;
    }
  }
  return count;
}

export function calculateWorkingDays(
  month: number,
  year: number,
  weeklyOffDays: number[],
  festivalHolidayCount = 0,
): number {
  const total = daysInMonth(month, year);
  const weeklyOffCount = countWeeklyOffDaysInMonth(month, year, weeklyOffDays);
  return total - weeklyOffCount - festivalHolidayCount;
}
