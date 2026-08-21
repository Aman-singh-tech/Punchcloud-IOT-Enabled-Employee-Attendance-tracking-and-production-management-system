import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { DevicesService } from "./devices.service";
import { CreateDeviceDto } from "./dto/create-device.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/roles.enum";

@ApiTags("devices")
@ApiBearerAuth()
@Controller("devices")
@Roles(Role.HR)
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Post()
  create(@Body() dto: CreateDeviceDto) {
    return this.devicesService.create(dto);
  }

  @Get()
  findAll() {
    return this.devicesService.findAll();
  }
}
