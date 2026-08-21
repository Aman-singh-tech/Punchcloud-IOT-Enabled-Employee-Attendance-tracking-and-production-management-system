import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

export type NotificationType =
  | "leave_requested"
  | "leave_approved"
  | "leave_rejected"
  | "payslip_ready";

// In-app bell (client-requested 2026-08-21, chosen over email — no SES sandbox/verification
// hassle needed, and both audiences already have the relevant app open regularly). This
// service is called from the existing leave/corrections/payroll services at the exact point
// an event happens; it never runs on its own schedule.
@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // HR is a single shared role at this company (see roles.enum.ts), not a per-user account,
  // so an "HR" notification has no employeeId — every HR login sees the same list.
  async notifyHr(type: NotificationType, message: string, link?: string) {
    return this.prisma.notification.create({
      data: { audience: "HR", type, message, link },
    });
  }

  async notifyEmployee(employeeId: number, type: NotificationType, message: string, link?: string) {
    return this.prisma.notification.create({
      data: { audience: "EMPLOYEE", employeeId, type, message, link },
    });
  }

  async listForHr(unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { audience: "HR", isRead: unreadOnly ? false : undefined },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async listForEmployee(employeeId: number, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { audience: "EMPLOYEE", employeeId, isRead: unreadOnly ? false : undefined },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async unreadCountForHr() {
    return this.prisma.notification.count({ where: { audience: "HR", isRead: false } });
  }

  async unreadCountForEmployee(employeeId: number) {
    return this.prisma.notification.count({
      where: { audience: "EMPLOYEE", employeeId, isRead: false },
    });
  }

  // Scoped to the caller's own audience/employeeId so an Employee can never mark an HR
  // notification (or another employee's) as read via a guessed id.
  async markRead(notificationId: number, audience: "HR" | "EMPLOYEE", employeeId?: number) {
    await this.prisma.notification.updateMany({
      where: { notificationId, audience, employeeId: audience === "EMPLOYEE" ? employeeId : undefined },
      data: { isRead: true },
    });
  }

  async markAllRead(audience: "HR" | "EMPLOYEE", employeeId?: number) {
    await this.prisma.notification.updateMany({
      where: { audience, employeeId: audience === "EMPLOYEE" ? employeeId : undefined, isRead: false },
      data: { isRead: true },
    });
  }
}
