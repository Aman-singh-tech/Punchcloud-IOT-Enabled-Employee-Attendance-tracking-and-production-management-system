import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../common/prisma.service";
import { CreateLocationDto } from "./dto/create-location.dto";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/roles.enum";

@ApiTags("locations")
@ApiBearerAuth()
@Controller("locations")
@Roles(Role.HR)
export class LocationsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  create(@Body() dto: CreateLocationDto) {
    return this.prisma.location.create({ data: dto });
  }

  @Get()
  findAll() {
    return this.prisma.location.findMany({ orderBy: { locationId: "asc" } });
  }
}

@ApiTags("departments")
@ApiBearerAuth()
@Controller("departments")
@Roles(Role.HR)
export class DepartmentsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  create(@Body() dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: dto });
  }

  @Get()
  findAll() {
    return this.prisma.department.findMany({ orderBy: { departmentId: "asc" } });
  }
}
