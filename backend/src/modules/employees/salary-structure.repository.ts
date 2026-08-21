import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { CryptoService } from "../../common/crypto.service";
import { CreateSalaryStructureDto, EmployeeType } from "./dto/create-salary-structure.dto";

type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;

export interface SalaryStructureView {
  salaryStructureId: number;
  employeeId: number;
  employeeType: EmployeeType;
  monthlyBaseSalary: number | null;
  perRecordRate: number | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

// Isolates the encrypted-column read/write path (LLD Section 6: salary details encrypted
// at rest) behind a plain-Decimal-in, plain-Decimal-out interface, so PayrollService and
// its tests never have to deal with ciphertext directly.
@Injectable()
export class SalaryStructureRepository {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {}

  // `client` defaults to the module-wide PrismaService, but callers that need this to
  // participate in a larger atomic operation (e.g. EmployeesService.create, which must not
  // leave an orphaned employee/user_account row behind if the salary structure step fails)
  // can pass a `tx` from an outer `$transaction(async (tx) => ...)` instead.
  async create(
    employeeId: number,
    dto: CreateSalaryStructureDto,
    client: PrismaClientOrTx = this.prisma,
  ): Promise<SalaryStructureView> {
    // Rule #1: only the field matching employeeType is ever persisted, regardless of what
    // else was sent on the DTO.
    const monthlyBaseSalaryEnc =
      dto.employeeType === "fixed_salary" && dto.monthlyBaseSalary != null
        ? this.crypto.encryptDecimal(dto.monthlyBaseSalary.toFixed(2))
        : null;
    const perRecordRateEnc =
      dto.employeeType === "piece_rate" && dto.perRecordRate != null
        ? this.crypto.encryptDecimal(dto.perRecordRate.toFixed(2))
        : null;

    const row = await client.salaryStructure.create({
      data: {
        employeeId,
        employeeType: dto.employeeType,
        monthlyBaseSalaryEnc,
        perRecordRateEnc,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
    });
    return this.toView(row);
  }

  // LLD 3.3: an active salary structure can be edited later; the change takes effect from a
  // specific date, and historical payroll always uses the rate active at the time. In
  // practice that means: close out the current row's effective_to, then insert a new row.
  async closeCurrentAndCreate(
    employeeId: number,
    newEffectiveFrom: string,
    dto: CreateSalaryStructureDto,
  ): Promise<SalaryStructureView> {
    const dayBefore = new Date(newEffectiveFrom);
    dayBefore.setDate(dayBefore.getDate() - 1);

    return this.prisma.$transaction(async (tx) => {
      await tx.salaryStructure.updateMany({
        where: { employeeId, effectiveTo: null },
        data: { effectiveTo: dayBefore },
      });

      const monthlyBaseSalaryEnc =
        dto.employeeType === "fixed_salary" && dto.monthlyBaseSalary != null
          ? this.crypto.encryptDecimal(dto.monthlyBaseSalary.toFixed(2))
          : null;
      const perRecordRateEnc =
        dto.employeeType === "piece_rate" && dto.perRecordRate != null
          ? this.crypto.encryptDecimal(dto.perRecordRate.toFixed(2))
          : null;

      const row = await tx.salaryStructure.create({
        data: {
          employeeId,
          employeeType: dto.employeeType,
          monthlyBaseSalaryEnc,
          perRecordRateEnc,
          effectiveFrom: new Date(newEffectiveFrom),
          effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        },
      });
      return this.toView(row);
    });
  }

  // The row whose [effective_from, effective_to] window contains `asOf` — used by the
  // payroll engine so a mid-month rate change never retroactively changes past payroll.
  async getActiveAsOf(employeeId: number, asOf: Date): Promise<SalaryStructureView | null> {
    const row = await this.prisma.salaryStructure.findFirst({
      where: {
        employeeId,
        effectiveFrom: { lte: asOf },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: asOf } }],
      },
      orderBy: { effectiveFrom: "desc" },
    });
    return row ? this.toView(row) : null;
  }

  async listByEmployee(employeeId: number): Promise<SalaryStructureView[]> {
    const rows = await this.prisma.salaryStructure.findMany({
      where: { employeeId },
      orderBy: { effectiveFrom: "desc" },
    });
    return rows.map((r) => this.toView(r));
  }

  private toView(row: {
    salaryStructureId: number;
    employeeId: number | null;
    employeeType: string;
    monthlyBaseSalaryEnc: Buffer | null;
    perRecordRateEnc: Buffer | null;
    effectiveFrom: Date;
    effectiveTo: Date | null;
  }): SalaryStructureView {
    return {
      salaryStructureId: row.salaryStructureId,
      employeeId: row.employeeId as number,
      employeeType: row.employeeType as EmployeeType,
      monthlyBaseSalary: row.monthlyBaseSalaryEnc
        ? parseFloat(this.crypto.decryptDecimal(row.monthlyBaseSalaryEnc))
        : null,
      perRecordRate: row.perRecordRateEnc
        ? parseFloat(this.crypto.decryptDecimal(row.perRecordRateEnc))
        : null,
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
    };
  }
}
