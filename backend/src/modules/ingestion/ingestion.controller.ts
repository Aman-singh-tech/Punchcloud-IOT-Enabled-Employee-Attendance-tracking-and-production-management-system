import { Body, Controller, HttpCode, Param, ParseIntPipe, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IngestionService } from "./ingestion.service";
import { PunchEventDto } from "./dto/punch-event.dto";
import { PunchBatchDto } from "./dto/punch-batch.dto";
import { DeviceAuth } from "../../common/decorators/device-auth.decorator";

// LLD 2.1: device-facing, authenticated via per-device API key, not a user JWT.
@ApiTags("ingestion")
@Controller("devices/:device_id/punches")
@DeviceAuth()
export class IngestionController {
  constructor(private ingestionService: IngestionService) {}

  @Post()
  @HttpCode(201)
  async ingestOne(@Param("device_id", ParseIntPipe) deviceId: number, @Body() dto: PunchEventDto) {
    return this.ingestionService.ingestPunch(deviceId, dto);
  }

  @Post("batch")
  @HttpCode(201)
  async ingestBatch(
    @Param("device_id", ParseIntPipe) deviceId: number,
    @Body() dto: PunchBatchDto,
  ) {
    return this.ingestionService.ingestBatch(deviceId, dto.punches);
  }
}
