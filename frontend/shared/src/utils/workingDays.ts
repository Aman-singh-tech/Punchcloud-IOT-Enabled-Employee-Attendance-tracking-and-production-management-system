// Client-side preview only, mirroring the backend's working-days formula
// (backend/src/modules/payroll/working-days.util.ts) — the server is always the source
// of truth for actual payroll; this is for showing an estimate in the UI before generation.
// Formula (Formulas doc Section 1): working_days = total_days_in_month - weekly_off_days - holidays_in_month
export function estimateWorkingDays(month: number, year: number, weeklyOffDays: number[], holidaysInMonthCount: number): number {
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let weeklyOffCount = 0;
  for (let day = 1; day <= totalDays; day++) {
    const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (weeklyOffDays.includes(dow)) weeklyOffCount++;
  }
  return totalDays - weeklyOffCount - holidaysInMonthCount;
}
