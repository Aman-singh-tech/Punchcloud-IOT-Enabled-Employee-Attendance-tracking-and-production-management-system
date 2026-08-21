import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateLocationDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}
