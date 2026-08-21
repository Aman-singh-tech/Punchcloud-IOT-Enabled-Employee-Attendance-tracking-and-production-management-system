import { Module } from "@nestjs/common";
import { IngestionService } from "./ingestion.service";
import { IngestionController } from "./ingestion.controller";
import { AttendanceModule } from "../attendance/attendance.module";

@Module({
  imports: [AttendanceModule],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}
