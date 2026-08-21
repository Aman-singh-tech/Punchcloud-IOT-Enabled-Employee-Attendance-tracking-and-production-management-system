export interface LeaveType {
  leaveTypeId: number;
  name: string;
  isPaid: boolean;
  annualQuota: number;
}

export type LeaveRequestStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  leaveId: number;
  employeeId: number;
  leaveTypeId: number;
  leaveType?: LeaveType;
  fromDate: string;
  toDate: string;
  reason: string | null;
  status: LeaveRequestStatus;
  approvedBy: number | null;
  createdAt: string;
}

export interface LeaveBalance {
  employeeId: number;
  leaveTypeId: number;
  leaveType?: LeaveType;
  year: number;
  allotted: number;
  used: number;
}

// A festival holiday (Diwali / Holi). The company observes exactly two a year; each is
// treated like a Sunday — outside working_days, so it costs nobody any salary.
export interface Holiday {
  holidayId: number;
  holidayDate: string;
  name: string | null;
  locationId: number | null;
}
