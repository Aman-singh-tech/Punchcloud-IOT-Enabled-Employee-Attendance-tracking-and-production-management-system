import { Module } from "@nestjs/common";
import { LeaveService } from "./leave.service";
import { LeaveController } from "./leave.controller";
import { HolidaysController, LeaveTypesController } from "./holidays.controller";

@Module({
  controllers: [LeaveController, HolidaysController, LeaveTypesController],
  providers: [LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {}
