import { IsInt, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateDepartmentDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsInt()
  locationId?: number;
}
