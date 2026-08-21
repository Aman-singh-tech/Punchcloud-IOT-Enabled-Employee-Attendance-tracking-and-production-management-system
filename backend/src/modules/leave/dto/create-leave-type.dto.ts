import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateLeaveTypeDto {
  @IsString()
  @MaxLength(30)
  name!: string;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  annualQuota?: number;
}
