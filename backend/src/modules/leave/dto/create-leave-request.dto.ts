import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";

export class CreateLeaveRequestDto {
  @IsInt()
  leaveTypeId!: number;

  @IsDateString()
  fromDate!: string;

  @IsDateString()
  toDate!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
