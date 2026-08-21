import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../common/prisma.service";
import { CreateHolidayDto } from "./dto/create-holiday.dto";
import { CreateLeaveTypeDto } from "./dto/create-leave-type.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/roles.enum";
import { parseDateOnly } from "../../common/utils/wall-clock.util";

// LLD 2.7: CRUD /holidays — HR.
@ApiTags("holidays")
@ApiBearerAuth()
@Controller("holidays")
@Roles(Role.HR)
export class HolidaysController {
  constructor(private prisma: PrismaService) {}

  @Post()
  create(@Body() dto: CreateHolidayDto) {
    return this.prisma.holidayCalendar.create({
      data: { ...dto, holidayDate: parseDateOnly(dto.holidayDate) },
    });
  }

  @Get()
  findAll() {
    return this.prisma.holidayCalendar.findMany({ orderBy: { holidayDate: "asc" } });
  }

  @Delete(":holiday_id")
  remove(@Param("holiday_id", ParseIntPipe) holidayId: number) {
    return this.prisma.holidayCalendar.delete({ where: { holidayId } });
  }
}

// Not an explicit LLD endpoint, but leave_type quotas are described as configurable
// (design doc 6.1) — HR manage them the same way holidays are managed. Reading the list,
// though, must be open to Employee too: self-service's "Apply for Leave" form populates its
// leave-type dropdown from this same GET — a class-level HR-only guard silently emptied
// that dropdown for every employee (found live 2026-08-21).
@ApiTags("leave-types")
@ApiBearerAuth()
@Controller("leave-types")
export class LeaveTypesController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @Roles(Role.HR)
  create(@Body() dto: CreateLeaveTypeDto) {
    return this.prisma.leaveType.create({ data: dto });
  }

  @Get()
  @Roles(Role.HR, Role.EMPLOYEE)
  findAll() {
    return this.prisma.leaveType.findMany({ orderBy: { leaveTypeId: "asc" } });
  }
}
