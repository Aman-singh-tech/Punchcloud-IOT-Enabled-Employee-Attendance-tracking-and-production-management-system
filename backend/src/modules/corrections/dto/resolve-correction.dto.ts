import { Type } from "class-transformer";
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Min, ValidateNested } from "class-validator";

class CorrectedAttendanceDto {
  @IsOptional()
  @IsIn(["Present", "Absent", "Half-day", "On Leave", "Holiday"])
  status?: string;

  @IsOptional()
  @IsISO8601()
  firstIn?: string;

  @IsOptional()
  @IsISO8601()
  lastOut?: string;
}

class CorrectedProductionDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  recordsProduced?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  recordsAccepted?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  recordsRejected?: number;
}

export class ResolveCorrectionDto {
  @IsIn(["approved", "rejected"])
  status!: "approved" | "rejected";

  @IsOptional()
  @IsString()
  resolutionNote?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CorrectedAttendanceDto)
  correctedAttendance?: CorrectedAttendanceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CorrectedProductionDto)
  correctedProduction?: CorrectedProductionDto;
}
