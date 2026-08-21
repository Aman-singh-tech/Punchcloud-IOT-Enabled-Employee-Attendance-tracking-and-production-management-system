import { IsDateString, IsIn, IsOptional, IsString } from "class-validator";

export class CreateCorrectionDto {
  @IsIn(["missed_punch", "wrong_attendance", "production_dispute"])
  requestType!: "missed_punch" | "wrong_attendance" | "production_dispute";

  @IsDateString()
  targetDate!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
