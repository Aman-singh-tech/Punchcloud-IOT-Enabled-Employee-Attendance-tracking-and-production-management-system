import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateHolidayDto {
  @IsDateString()
  holidayDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  locationId?: number;
}
