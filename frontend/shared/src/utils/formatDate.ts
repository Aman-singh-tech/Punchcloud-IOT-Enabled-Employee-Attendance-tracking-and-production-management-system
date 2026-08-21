// The backend deliberately stores every attendance/punch timestamp as literal wall-clock
// digits labeled as UTC (see backend/src/common/utils/wall-clock.util.ts) — this is a
// single-timezone system (Asia/Kolkata, per location.timezone default), and doing it this
// way avoids server-host-timezone-dependent parsing ambiguity. That means the frontend
// must read these values back with UTC getters, not local-timezone formatting: using
// toLocaleTimeString/toLocaleDateString here would reinterpret the UTC-labeled digits
// through the *browser's* local offset and silently shift displayed times (e.g. an 18:30
// punch rendering as "12:00 AM" the next day for an IST browser). Every date/time
// formatter in this file must stay UTC-based to match.

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const hours24 = d.getUTCHours();
  const minutes = d.getUTCMinutes().toString().padStart(2, "0");
  const period = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes} ${period}`;
}

export function formatMonthYear(month: number, year: number): string {
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${names[month - 1]} ${year}`;
}
