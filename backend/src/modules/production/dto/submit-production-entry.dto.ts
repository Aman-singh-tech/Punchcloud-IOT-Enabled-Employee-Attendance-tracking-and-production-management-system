import { IsDateString, IsInt, IsOptional, IsString, Min } from "class-validator";

export class SubmitProductionEntryDto {
  @IsInt()
  employeeId!: number;

  @IsDateString()
  entryDate!: string;

  @IsInt()
  @Min(0)
  recordsProduced!: number;

  @IsInt()
  @Min(0)
  recordsAccepted!: number;

  @IsInt()
  @Min(0)
  recordsRejected!: number;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
