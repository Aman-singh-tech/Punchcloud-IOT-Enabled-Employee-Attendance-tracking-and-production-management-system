import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// LLD Section 6: every write to attendance_daily/production_entry/payroll_record triggered
// by a correction or manual adjustment is logged with who/when/what-changed.
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    tableName: string;
    recordId: string | number | bigint;
    changedBy: number | null;
    oldValue: unknown;
    newValue: unknown;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tableName: params.tableName,
        recordId: String(params.recordId),
        changedBy: params.changedBy ?? undefined,
        oldValue: params.oldValue as any,
        newValue: params.newValue as any,
      },
    });
  }
}
