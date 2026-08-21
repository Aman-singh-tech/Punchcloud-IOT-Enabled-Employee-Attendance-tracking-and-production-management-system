import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { S3Service } from "../../common/s3.service";
import { AuditService } from "../../common/audit.service";
import { SubmitProductionEntryDto } from "./dto/submit-production-entry.dto";
import { UpdateProductionEntryDto } from "./dto/update-production-entry.dto";
import { parseDateOnly } from "../../common/utils/wall-clock.util";

// LLD 3.2: manual head-count entered by a supervisor, no file parsing — straight to the DB
// via this API call.
@Injectable()
export class ProductionService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
    private audit: AuditService,
  ) {}

  async submit(dto: SubmitProductionEntryDto, submittedByUserId: number) {
    if (dto.recordsAccepted + dto.recordsRejected > dto.recordsProduced) {
      throw new BadRequestException("Accepted + Rejected cannot exceed Produced");
    }

    const entryDate = parseDateOnly(dto.entryDate);
    const entry = await this.prisma.productionEntry.upsert({
      where: { employeeId_entryDate: { employeeId: dto.employeeId, entryDate } },
      create: {
        employeeId: dto.employeeId,
        entryDate,
        recordsProduced: dto.recordsProduced,
        recordsAccepted: dto.recordsAccepted,
        recordsRejected: dto.recordsRejected,
        rejectionReason: dto.rejectionReason,
        submittedBy: submittedByUserId,
      },
      update: {
        recordsProduced: dto.recordsProduced,
        recordsAccepted: dto.recordsAccepted,
        recordsRejected: dto.recordsRejected,
        rejectionReason: dto.rejectionReason,
        submittedBy: submittedByUserId,
      },
    });

    const [yyyy, mm, dd] = dto.entryDate.split("-");
    await this.s3.putJson(`production/${yyyy}/${mm}/${dd}/${dto.employeeId}.json`, {
      employeeId: dto.employeeId,
      entryDate: dto.entryDate,
      recordsProduced: dto.recordsProduced,
      recordsAccepted: dto.recordsAccepted,
      recordsRejected: dto.recordsRejected,
      rejectionReason: dto.rejectionReason ?? null,
      submittedBy: submittedByUserId,
    });

    return entry;
  }

  async correct(entryId: number, dto: UpdateProductionEntryDto, resolvedByUserId: number) {
    const existing = await this.prisma.productionEntry.findUnique({ where: { entryId } });
    if (!existing) {
      throw new NotFoundException(`Production entry ${entryId} not found`);
    }

    const produced = dto.recordsProduced ?? existing.recordsProduced;
    const accepted = dto.recordsAccepted ?? existing.recordsAccepted;
    const rejected = dto.recordsRejected ?? existing.recordsRejected;
    if (accepted + rejected > produced) {
      throw new BadRequestException("Accepted + Rejected cannot exceed Produced");
    }

    const updated = await this.prisma.productionEntry.update({
      where: { entryId },
      data: {
        recordsProduced: produced,
        recordsAccepted: accepted,
        recordsRejected: rejected,
        rejectionReason: dto.rejectionReason ?? existing.rejectionReason,
      },
    });

    await this.audit.log({
      tableName: "production_entry",
      recordId: entryId,
      changedBy: resolvedByUserId,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }

  async getHistory(employeeId: number, fromStr?: string, toStr?: string) {
    return this.prisma.productionEntry.findMany({
      where: {
        employeeId,
        entryDate: {
          gte: fromStr ? parseDateOnly(fromStr) : undefined,
          lte: toStr ? parseDateOnly(toStr) : undefined,
        },
      },
      orderBy: { entryDate: "asc" },
    });
  }

  // LLD 6 company-wide/department report: rejection_rate = rejected/produced * 100.
  // employeeId narrows the same report to a single employee — the totals/rejection-rate
  // chart reflect just that employee's numbers, not the whole company's.
  async getReport(
    departmentId?: number,
    fromStr?: string,
    toStr?: string,
    employeeId?: number,
  ) {
    const entries = await this.prisma.productionEntry.findMany({
      where: {
        entryDate: {
          gte: fromStr ? parseDateOnly(fromStr) : undefined,
          lte: toStr ? parseDateOnly(toStr) : undefined,
        },
        employeeId: employeeId ?? undefined,
        employee: departmentId ? { departmentId } : undefined,
      },
      include: {
        employee: { select: { employeeId: true, employeeCode: true, name: true, departmentId: true } },
      },
      orderBy: { entryDate: "desc" },
    });

    const totals = entries.reduce(
      (acc, e) => {
        acc.totalProduced += e.recordsProduced;
        acc.totalAccepted += e.recordsAccepted;
        acc.totalRejected += e.recordsRejected;
        return acc;
      },
      { totalProduced: 0, totalAccepted: 0, totalRejected: 0 },
    );

    const rejectionRate =
      totals.totalProduced > 0 ? (totals.totalRejected / totals.totalProduced) * 100 : 0;

    return { ...totals, rejectionRate, entries };
  }
}
