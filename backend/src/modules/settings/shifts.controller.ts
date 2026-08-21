import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ShiftsService } from "./shifts.service";
import { CreateShiftDto } from "./dto/create-shift.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/roles.enum";

// LLD 2.7: CRUD /shifts. Originally Admin-only; folded into HR per the single-role
// consolidation (see backend/src/common/roles.enum.ts).
@ApiTags("shifts")
@ApiBearerAuth()
@Controller("shifts")
@Roles(Role.HR)
export class ShiftsController {
  constructor(private shiftsService: ShiftsService) {}

  @Post()
  create(@Body() dto: CreateShiftDto) {
    return this.shiftsService.create(dto);
  }

  @Get()
  findAll() {
    return this.shiftsService.findAll();
  }

  @Get(":shift_id")
  findOne(@Param("shift_id", ParseIntPipe) shiftId: number) {
    return this.shiftsService.findOne(shiftId);
  }

  @Patch(":shift_id")
  update(@Param("shift_id", ParseIntPipe) shiftId: number, @Body() dto: Partial<CreateShiftDto>) {
    return this.shiftsService.update(shiftId, dto);
  }
}
