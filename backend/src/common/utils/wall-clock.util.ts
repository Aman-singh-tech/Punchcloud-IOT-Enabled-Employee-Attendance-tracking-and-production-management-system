// All attendance/shift math in this system is single-timezone (Asia/Kolkata, per
// location.timezone default) wall-clock arithmetic: "9:05 AM" minus "9:00 AM" grace
// should always be 5 minutes, regardless of what timezone the API server happens to run
// in. Parsing an offset-bearing ISO string with plain `new Date(...)` would convert it to
// an absolute UTC instant and make comparisons against a naive DB TIME column
// server-timezone-dependent. Instead we take the literal Y-M-D/H:M:S digits from the
// input (ignoring any offset suffix) and store them as UTC components — every Date in this
// module family should be built this way so getUTC*() always reads back the original wall
// clock digits, unaffected by host timezone.

const WALL_CLOCK_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/;

export function parseWallClockTimestamp(iso: string): Date {
  const match = WALL_CLOCK_RE.exec(iso);
  if (!match) {
    throw new Error(`Unrecognized timestamp format: ${iso}`);
  }
  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      second ? Number(second) : 0,
    ),
  );
}

export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// The company's operating timezone. Everything user-facing ("today", "yesterday", "the month
// that just ended") must be resolved in THIS zone, never in the server's zone and never in
// UTC — a server in UTC and a server in Asia/Kolkata must agree on what day it is for the
// business. Overridable so the same code can run for a company in another zone.
export const APP_TIMEZONE = process.env.APP_TIMEZONE ?? "Asia/Kolkata";

/**
 * Today's calendar date in the company's timezone as YYYY-MM-DD.
 *
 * Do NOT replace this with `new Date().toISOString().slice(0, 10)`. That reads the UTC date,
 * so between midnight and 05:30 IST it returns *yesterday* — which silently made the nightly
 * attendance job process the wrong day and the monthly payroll job target the wrong month.
 */
export function todayDateKey(now: Date = new Date(), timeZone: string = APP_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Shifts a YYYY-MM-DD key by whole days. Pure calendar math — no timezone involved. */
export function addDaysToDateKey(key: string, days: number): string {
  return dateKey(new Date(parseDateOnly(key).getTime() + days * 86_400_000));
}

/** The calendar month immediately before the one `dateKeyStr` falls in. */
export function previousMonthOf(dateKeyStr: string): { month: number; year: number } {
  const [year, month] = dateKeyStr.split("-").map(Number);
  // month is 1-based; month - 2 as a 0-based index is the previous month, and Date.UTC
  // normalises the January case (0 - 1 => December of the previous year) for us.
  const target = new Date(Date.UTC(year, month - 2, 1));
  return { month: target.getUTCMonth() + 1, year: target.getUTCFullYear() };
}

export function parseDateOnly(dateStr: string): Date {
  return parseWallClockTimestamp(`${dateStr}T00:00:00`);
}

// Combines dateOnly's Y-M-D with timeOfDay's H:M:S (both read via UTC getters).
export function combineDateAndTimeOfDay(dateOnly: Date, timeOfDay: Date): Date {
  return new Date(
    Date.UTC(
      dateOnly.getUTCFullYear(),
      dateOnly.getUTCMonth(),
      dateOnly.getUTCDate(),
      timeOfDay.getUTCHours(),
      timeOfDay.getUTCMinutes(),
      timeOfDay.getUTCSeconds(),
    ),
  );
}

export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

export function diffMinutes(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / 60_000;
}
