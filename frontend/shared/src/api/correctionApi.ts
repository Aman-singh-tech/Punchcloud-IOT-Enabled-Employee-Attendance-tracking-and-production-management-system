import { apiClient } from "./apiClient";

export interface CorrectionRequest {
  requestId: number;
  employeeId: number;
  requestType: "missed_punch" | "wrong_attendance" | "production_dispute";
  targetDate: string;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  resolvedBy: number | null;
  resolvedAt: string | null;
  createdAt: string;
}

export const correctionApi = {
  raise: (input: { requestType: CorrectionRequest["requestType"]; targetDate: string; description?: string }) =>
    apiClient.post<CorrectionRequest>("/corrections", input).then((r) => r.data),
  listMine: () => apiClient.get<CorrectionRequest[]>("/corrections/mine").then((r) => r.data),
  list: (status?: string) =>
    apiClient.get<CorrectionRequest[]>("/corrections", { params: { status } }).then((r) => r.data),
  resolve: (id: number, input: { status: "approved" | "rejected"; resolutionNote?: string }) =>
    apiClient.patch<CorrectionRequest>(`/corrections/${id}`, input).then((r) => r.data),
};
