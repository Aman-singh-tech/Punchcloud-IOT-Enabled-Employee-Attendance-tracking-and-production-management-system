import { IsInt, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateDeviceDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;

  @IsOptional()
  @IsInt()
  locationId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ipAddress?: string;
}
