import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@punchcloud/shared";

export interface MonthSummary {
  month: number;
  year: number;
  label: string;
  totalProduced: number;
  totalAccepted: number;
  totalRejected: number;
  rejectionRate: number;
  totalNetPay: number;
  payrollRecordCount: number;
  payrollFinalized: boolean;
}

export interface DashboardSummary {
  today: {
    date: string;
    present: number;
    halfDay: number;
    absent: number;
    onLeave: number;
    off: number;
    awaiting: number;
  };
  activeEmployees: number;
  months: MonthSummary[];
}

export function useDashboardSummary(months = 6) {
  return useQuery({
    queryKey: ["dashboard-summary", months],
    queryFn: () =>
      apiClient
        .get<DashboardSummary>("/dashboard/summary", { params: { months } })
        .then((r) => r.data),
    // HR leaves this screen open during the day; punches land continuously, so keep the
    // today-counts fresh without a manual reload.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
