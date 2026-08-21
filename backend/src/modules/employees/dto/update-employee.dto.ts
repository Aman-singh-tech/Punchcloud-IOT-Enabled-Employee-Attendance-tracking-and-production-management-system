import { IsIn, IsInt, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string;

  @IsOptional()
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @IsInt()
  locationId?: number;

  @IsOptional()
  @IsInt()
  shiftId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  deviceEnrollmentId?: string;

  @IsOptional()
  @IsIn(["active", "inactive", "terminated"])
  status?: string;
}
