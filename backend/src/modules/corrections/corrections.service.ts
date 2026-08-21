import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { AuditService } from "../../common/audit.service";
import { CreateCorrectionDto } from "./dto/create-correction.dto";
import { ResolveCorrectionDto } from "./dto/resolve-correction.dto";
import { parseDateOnly } from "../../common/utils/wall-clock.util";

// Design doc Section 6.7: raise -> supervisor/HR approves or rejects, with a reason ->
// if approved, the underlying attendance_daily/production_entry record is corrected and
// flagged is_manually_adjusted, never silently overwritten.
@Injectable()
export class CorrectionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async raise(employeeId: number, dto: CreateCorrectionDto) {
    return this.prisma.correctionRequest.create({
      data: {
        employeeId,
        requestType: dto.requestType,
        targetDate: parseDateOnly(dto.targetDate),
        description: dto.description,
        status: "pending",
      },
    });
  }

  async listMine(employeeId: number) {
    return this.prisma.correctionRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    });
  }

  async listByStatus(status?: string) {
    return this.prisma.correctionRequest.findMany({
      where: status ? { status } : undefined,
      include: { employee: { select: { employeeId: true, name: true, employeeCode: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async resolve(requestId: number, dto: ResolveCorrectionDto, resolvedByUserId: number) {
    const request = await this.prisma.correctionRequest.findUnique({ where: { requestId } });
    if (!request) {
      throw new NotFoundException(`Correction request ${requestId} not found`);
    }
    if (request.status !== "pending") {
      throw new ForbiddenException(`Correction request ${requestId} is already ${request.status}`);
    }

    if (dto.status === "approved" && request.employeeId && request.targetDate) {
      if (request.requestType === "production_dispute" && dto.correctedProduction) {
        await this.applyProductionCorrection(
          request.employeeId,
          request.targetDate,
          dto.correctedProduction,
          resolvedByUserId,
        );
      } else if (
        (request.requestType === "missed_punch" || request.requestType === "wrong_attendance") &&
        dto.correctedAttendance
      ) {
        await this.applyAttendanceCorrection(
          request.employeeId,
          request.targetDate,
          dto.correctedAttendance,
          resolvedByUserId,
        );
      } else if (dto.correctedAttendance || dto.correctedProduction) {
        throw new BadRequestException(
          "Correction payload does not match the correction request's type",
        );
      }
    }

    return this.prisma.correctionRequest.update({
      where: { requestId },
      data: {
        status: dto.status,
        resolvedBy: resolvedByUserId,
        resolvedAt: new Date(),
        description: dto.resolutionNote
          ? `${request.description ?? ""}\n[Resolution] ${dto.resolutionNote}`
          : request.description,
      },
    });
  }

  private async applyAttendanceCorrection(
    employeeId: number,
    targetDate: Date,
    correction: { status?: string; firstIn?: string; lastOut?: string },
    resolvedByUserId: number,
  ) {
    const existing = await this.prisma.attendanceDaily.findUnique({
      where: { employeeId_attendanceDate: { employeeId, attendanceDate: targetDate } },
    });

    const updated = await this.prisma.attendanceDaily.upsert({
      where: { employeeId_attendanceDate: { employeeId, attendanceDate: targetDate } },
      create: {
        employeeId,
        attendanceDate: targetDate,
        status: correction.status ?? "Present",
        firstIn: correction.firstIn ? new Date(correction.firstIn) : undefined,
        lastOut: correction.lastOut ? new Date(correction.lastOut) : undefined,
        isManuallyAdjusted: true,
      },
      update: {
        status: correction.status ?? existing?.status,
        firstIn: correction.firstIn ? new Date(correction.firstIn) : existing?.firstIn,
        lastOut: correction.lastOut ? new Date(correction.lastOut) : existing?.lastOut,
        isManuallyAdjusted: true,
      },
    });

    await this.audit.log({
      tableName: "attendance_daily",
      recordId: updated.attendanceId,
      changedBy: resolvedByUserId,
      oldValue: existing,
      newValue: updated,
    });
  }

  private async applyProductionCorrection(
    employeeId: number,
    targetDate: Date,
    correction: { recordsProduced?: number; recordsAccepted?: number; recordsRejected?: number },
    resolvedByUserId: number,
  ) {
    const existing = await this.prisma.productionEntry.findUnique({
      where: { employeeId_entryDate: { employeeId, entryDate: targetDate } },
    });

    const produced = correction.recordsProduced ?? existing?.recordsProduced ?? 0;
    const accepted = correction.recordsAccepted ?? existing?.recordsAccepted ?? 0;
    const rejected = correction.recordsRejected ?? existing?.recordsRejected ?? 0;
    if (accepted + rejected > produced) {
      throw new BadRequestException("Accepted + Rejected cannot exceed Produced");
    }

    const updated = await this.prisma.productionEntry.upsert({
      where: { employeeId_entryDate: { employeeId, entryDate: targetDate } },
      create: {
        employeeId,
        entryDate: targetDate,
        recordsProduced: produced,
        recordsAccepted: accepted,
        recordsRejected: rejected,
        submittedBy: resolvedByUserId,
      },
      update: {
        recordsProduced: produced,
        recordsAccepted: accepted,
        recordsRejected: rejected,
      },
    });

    await this.audit.log({
      tableName: "production_entry",
      recordId: updated.entryId,
      changedBy: resolvedByUserId,
      oldValue: existing,
      newValue: updated,
    });
  }
}
