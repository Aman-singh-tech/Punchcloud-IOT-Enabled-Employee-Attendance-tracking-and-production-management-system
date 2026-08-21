import { Module } from "@nestjs/common";
import { ShiftsService } from "./shifts.service";
import { ShiftsController } from "./shifts.controller";
import { DevicesService } from "./devices.service";
import { DevicesController } from "./devices.controller";
import { LocationsController, DepartmentsController } from "./locations.controller";

@Module({
  controllers: [ShiftsController, DevicesController, LocationsController, DepartmentsController],
  providers: [ShiftsService, DevicesService],
  exports: [ShiftsService, DevicesService],
})
export class SettingsModule {}
