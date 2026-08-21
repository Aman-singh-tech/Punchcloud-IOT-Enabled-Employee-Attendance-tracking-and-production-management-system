// "Off" covers both a weekly off and a day the office was closed (a company holiday) —
// there is no separate "Holiday" status any more.
export type AttendanceStatus = "Present" | "Absent" | "Half-day" | "On Leave" | "Off";

export interface AttendanceDaily {
  attendanceId: string;
  employeeId: number;
  attendanceDate: string;
  firstIn: string | null;
  lastOut: string | null;
  lateMinutes: number;
  otMinutes: number; // informational only — never paid, for either employee type
  // Arrived more than the shift's lateThresholdMinutes after start time. The 5th+ late day
  // in a month is downgraded to Half-day.
  isLate: boolean;
  status: AttendanceStatus;
  leaveTypeId: number | null;
  isManuallyAdjusted: boolean;
}

export interface PunchLog {
  punchId: string;
  employeeId: number;
  deviceId: number;
  punchTimestamp: string;
  direction: "IN" | "OUT" | null;
}
