import { Module } from "@nestjs/common";
import { CorrectionsService } from "./corrections.service";
import { CorrectionsController } from "./corrections.controller";

@Module({
  controllers: [CorrectionsController],
  providers: [CorrectionsService],
})
export class CorrectionsModule {}
