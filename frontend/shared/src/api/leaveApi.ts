import { apiClient } from "./apiClient";
import { Holiday, LeaveBalance, LeaveRequest, LeaveType } from "../types/leave";

export const leaveApi = {
  submit: (input: { leaveTypeId: number; fromDate: string; toDate: string; reason?: string }) =>
    apiClient.post<LeaveRequest>("/leave/requests", input).then((r) => r.data),
  list: (status?: string) =>
    apiClient.get<LeaveRequest[]>("/leave/requests", { params: { status } }).then((r) => r.data),
  updateStatus: (id: number, status: "approved" | "rejected") =>
    apiClient.patch<LeaveRequest>(`/leave/requests/${id}`, { status }).then((r) => r.data),
  getBalance: (employeeId: number) =>
    apiClient.get<LeaveBalance[]>(`/leave/balance/${employeeId}`).then((r) => r.data),
  // Festival holidays (Diwali / Holi). These are the only company holidays — each one is
  // treated exactly like a Sunday: excluded from working_days, so nobody is docked for it.
  listHolidays: () => apiClient.get<Holiday[]>("/holidays").then((r) => r.data),
  createHoliday: (input: { holidayDate: string; name?: string; locationId?: number }) =>
    apiClient.post<Holiday>("/holidays", input).then((r) => r.data),
  deleteHoliday: (holidayId: number) =>
    apiClient.delete(`/holidays/${holidayId}`).then((r) => r.data),
  listLeaveTypes: () => apiClient.get<LeaveType[]>("/leave-types").then((r) => r.data),
};
