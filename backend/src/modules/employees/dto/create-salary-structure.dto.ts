import { IsDateString, IsIn, IsNumber, IsOptional, IsPositive, ValidateIf } from "class-validator";

// Non-Negotiable Rule #1: employee_type is exactly one of these two values, never a third.
export type EmployeeType = "piece_rate" | "fixed_salary";

export class CreateSalaryStructureDto {
  @IsIn(["piece_rate", "fixed_salary"])
  employeeType!: EmployeeType;

  @ValidateIf((o) => o.employeeType === "fixed_salary")
  @IsNumber()
  @IsPositive()
  monthlyBaseSalary?: number;

  @ValidateIf((o) => o.employeeType === "piece_rate")
  @IsNumber()
  @IsPositive()
  perRecordRate?: number;

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
