import {
  addDaysToDateKey,
  previousMonthOf,
  todayDateKey,
} from "../src/common/utils/wall-clock.util";

// Regression tests for a real production bug found on 2026-08-21.
//
// Both cron jobs derived their target date from the UTC clock. In India (UTC+5:30) the cron
// fires at 01:00/02:00 local, which is still the PREVIOUS DAY in UTC — so:
//   * the nightly attendance job processed the day before yesterday, every night;
//   * the monthly payroll job, running 02:00 on the 1st, resolved to TWO months back and
//     would have generated July's payroll on 1 September.
//
// These assert the company-timezone behaviour regardless of the server's own zone.

const IST = "Asia/Kolkata";

/** 01:00 IST on 1 Sep 2026, as a real instant (= 19:30 UTC on 31 Aug). */
const ONE_AM_IST_SEP_1 = new Date("2026-09-01T01:00:00+05:30");
/** 02:00 IST on 1 Sep 2026 (= 20:30 UTC on 31 Aug). */
const TWO_AM_IST_SEP_1 = new Date("2026-09-01T02:00:00+05:30");

describe("todayDateKey — the day the business is actually on", () => {
  it("returns the local date at 01:00 IST, not the UTC date", () => {
    expect(ONE_AM_IST_SEP_1.toISOString().slice(0, 10)).toBe("2026-08-31"); // the old, wrong value
    expect(todayDateKey(ONE_AM_IST_SEP_1, IST)).toBe("2026-09-01");
  });

  it("is stable across the whole IST early-morning window", () => {
    for (const t of ["00:01", "02:30", "05:29", "05:31", "12:00", "23:59"]) {
      expect(todayDateKey(new Date(`2026-09-01T${t}:00+05:30`), IST)).toBe("2026-09-01");
    }
  });

  it("does not depend on the server's own timezone — the instant decides", () => {
    const midday = new Date("2026-09-01T12:00:00+05:30");
    expect(todayDateKey(midday, IST)).toBe("2026-09-01");
    expect(todayDateKey(midday, "UTC")).toBe("2026-09-01"); // 06:30 UTC, same day
  });
});

describe("nightly attendance job — which day gets computed", () => {
  it("at 01:00 IST on 1 Sep it processes 31 Aug, not 30 Aug", () => {
    const oldBuggy = new Date(ONE_AM_IST_SEP_1.getTime() - 86_400_000).toISOString().slice(0, 10);
    expect(oldBuggy).toBe("2026-08-30"); // the bug: a whole day skipped

    expect(addDaysToDateKey(todayDateKey(ONE_AM_IST_SEP_1, IST), -1)).toBe("2026-08-31");
  });

  it("steps back correctly across a month boundary", () => {
    expect(addDaysToDateKey("2026-09-01", -1)).toBe("2026-08-31");
    expect(addDaysToDateKey("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDaysToDateKey("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("monthly payroll job — which month gets generated", () => {
  it("at 02:00 IST on 1 Sep it generates AUGUST, not July", () => {
    const now = TWO_AM_IST_SEP_1;
    const oldBuggy = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    expect(oldBuggy.getUTCMonth() + 1).toBe(7); // the bug: July

    expect(previousMonthOf(todayDateKey(now, IST))).toEqual({ month: 8, year: 2026 });
  });

  it("rolls back into the previous year in January", () => {
    expect(previousMonthOf("2027-01-01")).toEqual({ month: 12, year: 2026 });
  });

  it("handles every month of the year", () => {
    for (let m = 1; m <= 12; m++) {
      const key = `2026-${String(m).padStart(2, "0")}-01`;
      const expected = m === 1 ? { month: 12, year: 2025 } : { month: m - 1, year: 2026 };
      expect(previousMonthOf(key)).toEqual(expected);
    }
  });
});
