import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { CreateShiftDto } from "./dto/create-shift.dto";

function toTimeDate(hhmm: string): Date {
  // Prisma's @db.Time maps to a Date where only the time-of-day portion is meaningful.
  const [h, m, s] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, h, m, s ?? 0));
}

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateShiftDto) {
    return this.prisma.shift.create({
      data: {
        name: dto.name,
        startTime: toTimeDate(dto.startTime),
        endTime: toTimeDate(dto.endTime),
        gracePeriodMinutes: dto.gracePeriodMinutes ?? 10,
        standardHours: dto.standardHours ?? 8.0,
        weeklyOffDays: dto.weeklyOffDays ?? [0],
      },
    });
  }

  findAll() {
    return this.prisma.shift.findMany({ orderBy: { shiftId: "asc" } });
  }

  async findOne(shiftId: number) {
    const shift = await this.prisma.shift.findUnique({ where: { shiftId } });
    if (!shift) throw new NotFoundException(`Shift ${shiftId} not found`);
    return shift;
  }

  async update(shiftId: number, dto: Partial<CreateShiftDto>) {
    await this.findOne(shiftId);
    return this.prisma.shift.update({
      where: { shiftId },
      data: {
        name: dto.name,
        startTime: dto.startTime ? toTimeDate(dto.startTime) : undefined,
        endTime: dto.endTime ? toTimeDate(dto.endTime) : undefined,
        gracePeriodMinutes: dto.gracePeriodMinutes,
        standardHours: dto.standardHours,
        weeklyOffDays: dto.weeklyOffDays,
      },
    });
  }
}
