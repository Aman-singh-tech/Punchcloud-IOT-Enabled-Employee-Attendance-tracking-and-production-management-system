import { IsDateString, IsInt, IsOptional } from "class-validator";

export class RecalculateDto {
  @IsOptional()
  @IsInt()
  employeeId?: number;

  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
