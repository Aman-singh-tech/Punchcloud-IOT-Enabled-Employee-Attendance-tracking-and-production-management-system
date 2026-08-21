export type NotificationType = "leave_requested" | "leave_approved" | "leave_rejected" | "payslip_ready";

export interface AppNotification {
  notificationId: number;
  audience: "HR" | "EMPLOYEE";
  employeeId: number | null;
  type: NotificationType;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}
