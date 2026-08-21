import { Type } from "class-transformer";
import { ArrayMinSize, ValidateNested } from "class-validator";
import { PunchEventDto } from "./punch-event.dto";

export class PunchBatchDto {
  @ValidateNested({ each: true })
  @Type(() => PunchEventDto)
  @ArrayMinSize(1)
  punches!: PunchEventDto[];
}
