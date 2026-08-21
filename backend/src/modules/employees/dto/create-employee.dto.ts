import { Type } from "class-transformer";
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { CreateSalaryStructureDto } from "./create-salary-structure.dto";

export class CreateEmployeeDto {
  @IsString()
  @MaxLength(20)
  employeeCode!: string;

  // Used to auto-create this employee's self-service login (role = Employee) at the same
  // time as the employee record — without this, HR would have no way to give a new
  // employee access at all (there was no employee-onboarding-creates-a-login flow before).
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  deviceEnrollmentId?: string;

  @IsString()
  @MaxLength(150)
  name!: string;

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
  @IsDateString()
  dateOfJoining?: string;

  @ValidateNested()
  @Type(() => CreateSalaryStructureDto)
  salaryStructure!: CreateSalaryStructureDto;
}
