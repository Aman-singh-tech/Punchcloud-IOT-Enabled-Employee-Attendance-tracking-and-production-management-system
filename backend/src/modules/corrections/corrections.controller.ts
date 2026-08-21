import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CorrectionsService } from "./corrections.service";
import { CreateCorrectionDto } from "./dto/create-correction.dto";
import { ResolveCorrectionDto } from "./dto/resolve-correction.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/roles.enum";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

// LLD 2.6.
@ApiTags("corrections")
@ApiBearerAuth()
@Controller("corrections")
export class CorrectionsController {
  constructor(private correctionsService: CorrectionsService) {}

  @Post()
  @Roles(Role.EMPLOYEE)
  raise(@Body() dto: CreateCorrectionDto, @CurrentUser() user: AuthenticatedUser) {
    if (!user.employeeId) {
      throw new BadRequestException("This account is not linked to an employee record");
    }
    return this.correctionsService.raise(user.employeeId, dto);
  }

  @Get("mine")
  @Roles(Role.EMPLOYEE)
  listMine(@CurrentUser() user: AuthenticatedUser) {
    if (!user.employeeId) {
      throw new BadRequestException("This account is not linked to an employee record");
    }
    return this.correctionsService.listMine(user.employeeId);
  }

  @Get()
  @Roles(Role.HR)
  list(@Query("status") status?: string) {
    return this.correctionsService.listByStatus(status);
  }

  @Patch(":id")
  @Roles(Role.HR)
  resolve(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ResolveCorrectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.correctionsService.resolve(id, dto, user.userId);
  }
}
