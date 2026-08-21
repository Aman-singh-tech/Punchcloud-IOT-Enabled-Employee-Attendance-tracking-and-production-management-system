import { apiClient } from "./apiClient";
import { AttendanceDaily } from "../types/attendance";

export const attendanceApi = {
  getHistory: (employeeId: number, from?: string, to?: string) =>
    apiClient
      .get<AttendanceDaily[]>(`/attendance/${employeeId}`, { params: { from, to } })
      .then((r) => r.data),
  getToday: () => apiClient.get<AttendanceDaily[]>("/attendance/today").then((r) => r.data),
  getLateReport: (month: number, year: number) =>
    apiClient.get<AttendanceDaily[]>("/attendance/late-report", { params: { month, year } }).then((r) => r.data),
  recalculate: (from: string, to: string, employeeId?: number) =>
    apiClient.post("/attendance/recalculate", { from, to, employeeId }).then((r) => r.data),
};
