import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateProductionEntryDto {
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

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
