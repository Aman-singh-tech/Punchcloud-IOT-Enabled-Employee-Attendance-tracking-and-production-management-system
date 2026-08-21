import { Module } from "@nestjs/common";
import { CorrectionsService } from "./corrections.service";
import { CorrectionsController } from "./corrections.controller";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [CorrectionsController],
  providers: [CorrectionsService],
})
export class CorrectionsModule {}
