import { apiClient } from "./apiClient";
import { PayrollRecord } from "../types/payroll";

export const payrollApi = {
  generate: (month: number, year: number) =>
    apiClient.post("/payroll/generate", null, { params: { month, year } }).then((r) => r.data),
  listByPeriod: (month: number, year: number) =>
    apiClient.get<PayrollRecord[]>("/payroll", { params: { month, year } }).then((r) => r.data),
  getPayslip: (employeeId: number, month: number, year: number) =>
    apiClient.get<PayrollRecord>(`/payroll/${employeeId}`, { params: { month, year } }).then((r) => r.data),
  getHistory: (employeeId: number) =>
    apiClient.get<PayrollRecord[]>(`/payroll/${employeeId}/history`).then((r) => r.data),
  finalize: (payrollId: string) =>
    apiClient.post<PayrollRecord>(`/payroll/${payrollId}/finalize`).then((r) => r.data),
  disbursementFileUrl: (month: number, year: number) =>
    `${apiClient.defaults.baseURL}/payroll/disbursement-file?month=${month}&year=${year}`,
};
