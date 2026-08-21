import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../common/prisma.service";
import { SalaryStructureRepository } from "./salary-structure.repository";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { CreateSalaryStructureDto } from "./dto/create-salary-structure.dto";
import { generateTempPassword } from "../../common/utils/generate-password.util";

// Prisma's P2002 error names the colliding column(s) in `meta.target`, but only as raw DB
// column names (e.g. "device_enrollment_id") — translated here into the field name HR
// actually typed into, so "Save failed" becomes an actionable message instead of a silent
// 500. Previously any unique-constraint violation (duplicate employee code, device ID
// already assigned to another employee, or an email already in use) surfaced as a generic
// "Internal server error" with no indication of which field to fix.
const UNIQUE_FIELD_LABELS: Record<string, string> = {
  employee_code: "Employee Code",
  device_enrollment_id: "Device Enrollment ID",
  email: "Login Email",
};

function describeUniqueViolation(err: unknown): string | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = (err.meta?.target as string[] | string | undefined) ?? [];
    const columns = Array.isArray(target) ? target : [target];
    const labels = columns.map((c) => UNIQUE_FIELD_LABELS[c] ?? c);
    return `${labels.join(", ")} already in use by another employee — please use a different value`;
  }
  return null;
}

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private salaryStructures: SalaryStructureRepository,
  ) {}

  // Creates the employee record, its self-service login (role = Employee), and its salary
  // structure together, atomically — without this, HR would have no way to give a newly
  // onboarded employee access at all, and a failure partway through (e.g. a duplicate
  // Device Enrollment ID) would previously leave an orphaned employee/login behind that
  // then collided with every retry. The generated password is returned exactly once in
  // this response; only its bcrypt hash is ever persisted. HR is expected to relay it to
  // the employee directly (e.g. WhatsApp, printed slip).
  async create(dto: CreateEmployeeDto) {
    const employeeRole = await this.prisma.role.findUnique({ where: { name: "Employee" } });
    if (!employeeRole) {
      throw new BadRequestException("The 'Employee' role is not configured — run the seed script first");
    }

    const temporaryPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const employee = await tx.employee.create({
          data: {
            employeeCode: dto.employeeCode,
            deviceEnrollmentId: dto.deviceEnrollmentId,
            name: dto.name,
            designation: dto.designation,
            departmentId: dto.departmentId,
            locationId: dto.locationId,
            shiftId: dto.shiftId,
            dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : undefined,
          },
        });
        await tx.userAccount.create({
          data: {
            employeeId: employee.employeeId,
            email: dto.email,
            passwordHash,
            roleId: employeeRole.roleId,
          },
        });
        const salaryStructure = await this.salaryStructures.create(employee.employeeId, dto.salaryStructure, tx);
        return { employee, salaryStructure };
      });

      return {
        ...result.employee,
        salaryStructure: result.salaryStructure,
        loginEmail: dto.email,
        temporaryPassword,
      };
    } catch (err) {
      const message = describeUniqueViolation(err);
      if (message) {
        throw new BadRequestException(message);
      }
      throw err;
    }
  }

  async findAll() {
    return this.prisma.employee.findMany({
      include: { department: true, location: true, shift: true },
      orderBy: { employeeId: "asc" },
    });
  }

  async findOne(employeeId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { employeeId },
      include: { department: true, location: true, shift: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }
    const salaryStructures = await this.salaryStructures.listByEmployee(employeeId);
    return { ...employee, salaryStructures };
  }

  async update(employeeId: number, dto: UpdateEmployeeDto) {
    await this.ensureExists(employeeId);
    try {
      return await this.prisma.employee.update({
        where: { employeeId },
        data: dto,
      });
    } catch (err) {
      const message = describeUniqueViolation(err);
      if (message) {
        throw new BadRequestException(message);
      }
      throw err;
    }
  }

  // LLD 3.3: employee_type / rate can change later, effective from a specific date;
  // historical payroll keeps using whatever was active at the time (effective_from/to).
  async changeSalaryStructure(employeeId: number, dto: CreateSalaryStructureDto) {
    await this.ensureExists(employeeId);
    return this.salaryStructures.closeCurrentAndCreate(employeeId, dto.effectiveFrom, dto);
  }

  // HR-initiated password reset — no email/SMS infrastructure required. Returns the new
  // plaintext password exactly once; only its bcrypt hash is persisted.
  async resetPassword(employeeId: number): Promise<{ loginEmail: string; temporaryPassword: string }> {
    const account = await this.prisma.userAccount.findFirst({ where: { employeeId } });
    if (!account) {
      throw new NotFoundException(
        `No login account exists for employee ${employeeId} — this employee predates the auto-login feature`,
      );
    }
    const temporaryPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    await this.prisma.userAccount.update({
      where: { userId: account.userId },
      data: { passwordHash },
    });
    return { loginEmail: account.email, temporaryPassword };
  }

  private async ensureExists(employeeId: number) {
    const exists = await this.prisma.employee.findUnique({ where: { employeeId } });
    if (!exists) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }
  }
}
