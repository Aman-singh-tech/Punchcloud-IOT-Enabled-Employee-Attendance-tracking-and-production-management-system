import { apiClient } from "./apiClient";
import { ProductionEntry } from "../types/production";

export const productionApi = {
  submit: (input: {
    employeeId: number;
    entryDate: string;
    recordsProduced: number;
    recordsAccepted: number;
    recordsRejected: number;
    rejectionReason?: string;
  }) => apiClient.post<ProductionEntry>("/production/entries", input).then((r) => r.data),
  correct: (id: number, input: Partial<{ recordsProduced: number; recordsAccepted: number; recordsRejected: number; rejectionReason: string }>) =>
    apiClient.patch<ProductionEntry>(`/production/entries/${id}`, input).then((r) => r.data),
  getHistory: (employeeId: number, from?: string, to?: string) =>
    apiClient
      .get<ProductionEntry[]>(`/production/${employeeId}`, { params: { from, to } })
      .then((r) => r.data),
  getReport: (department?: number, from?: string, to?: string, employeeId?: number) =>
    apiClient
      .get("/production/report", { params: { department, from, to, employee_id: employeeId } })
      .then((r) => r.data),
};
