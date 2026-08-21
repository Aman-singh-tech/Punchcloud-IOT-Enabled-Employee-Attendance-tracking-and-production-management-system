import { IsIn, IsISO8601, IsOptional, IsString } from "class-validator";

// LLD 2.1 request body: { "employee_device_id": "EMP-BIO-102", "timestamp": "...", "direction": "IN" }
export class PunchEventDto {
  @IsString()
  employee_device_id!: string;

  @IsISO8601()
  timestamp!: string;

  @IsOptional()
  @IsIn(["IN", "OUT"])
  direction?: "IN" | "OUT";
}
