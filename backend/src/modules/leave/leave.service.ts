import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";
import { parseDateOnly, todayDateKey } from "../../common/utils/wall-clock.util";

function durationDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
}

function* dateRange(from: Date, to: Date): Generator<Date> {
  for (let d = new Date(from); d <= to; d = new Date(d.getTime() + 86_400_000)) {
    yield d;
  }
}

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  async submit(employeeId: number, dto: CreateLeaveRequestDto) {
    const from = parseDateOnly(dto.fromDate);
    const to = parseDateOnly(dto.toDate);
    if (to < from) {
      throw new BadRequestException("toDate cannot be before fromDate");
    }
    return this.prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId: dto.leaveTypeId,
        fromDate: from,
        toDate: to,
        reason: dto.reason,
        status: "pending",
      },
    });
  }

  // employeeId is set only for a self-service caller (Employee role) — see
  // LeaveController.list, which forces this so an Employee can only ever see their own
  // requests, never anyone else's. HR omit it and see everyone.
  async listByStatus(status?: string, employeeId?: number) {
    return this.prisma.leaveRequest.findMany({
      where: { status: status || undefined, employeeId },
      include: {
        employee: { select: { employeeId: true, name: true, employeeCode: true } },
        leaveType: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // LLD 3.4 on_leave_approved: bump leave_balance.used and mark every date in range
  // "On Leave" in attendance_daily. Rejections just flip the status field.
  async updateStatus(leaveId: number, status: "approved" | "rejected", approvedByUserId: number) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({ where: { leaveId } });
    if (!leaveRequest) {
      throw new NotFoundException(`Leave request ${leaveId} not found`);
    }
    if (leaveRequest.status !== "pending") {
      throw new ForbiddenException(`Leave request ${leaveId} is already ${leaveRequest.status}`);
    }

    if (status === "rejected") {
      return this.prisma.leaveRequest.update({
        where: { leaveId },
        data: { status: "rejected", approvedBy: approvedByUserId },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { leaveId },
        data: { status: "approved", approvedBy: approvedByUserId },
      });

      const days = durationDays(leaveRequest.fromDate, leaveRequest.toDate);
      const year = leaveRequest.fromDate.getUTCFullYear();

      await tx.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: leaveRequest.employeeId!,
            leaveTypeId: leaveRequest.leaveTypeId!,
            year,
          },
        },
        create: {
          employeeId: leaveRequest.employeeId!,
          leaveTypeId: leaveRequest.leaveTypeId!,
          year,
          allotted: 0,
          used: days,
        },
        update: { used: { increment: days } },
      });

      for (const date of dateRange(leaveRequest.fromDate, leaveRequest.toDate)) {
        await tx.attendanceDaily.upsert({
          where: {
            employeeId_attendanceDate: {
              employeeId: leaveRequest.employeeId!,
              attendanceDate: date,
            },
          },
          create: {
            employeeId: leaveRequest.employeeId!,
            attendanceDate: date,
            status: "On Leave",
            leaveTypeId: leaveRequest.leaveTypeId,
          },
          update: {
            status: "On Leave",
            leaveTypeId: leaveRequest.leaveTypeId,
          },
        });
      }

      return updated;
    });
  }

  async getBalance(employeeId: number) {
    // Company timezone — reading the UTC year meant that on 1 January before 05:30 IST the
    // balance for the *previous* year was returned.
    const year = Number(todayDateKey().slice(0, 4));
    return this.prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
    });
  }
}
