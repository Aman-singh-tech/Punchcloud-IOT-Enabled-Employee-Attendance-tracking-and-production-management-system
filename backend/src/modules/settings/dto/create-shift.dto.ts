import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class CreateShiftDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @Matches(TIME_RE, { message: "startTime must be HH:mm or HH:mm:ss" })
  startTime!: string;

  @Matches(TIME_RE, { message: "endTime must be HH:mm or HH:mm:ss" })
  endTime!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  gracePeriodMinutes?: number;

  @IsOptional()
  @IsNumber()
  standardHours?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weeklyOffDays?: number[];

  // Monthly late-comer policy. Arriving more than lateThresholdMinutes after startTime marks
  // the day late; the first lateDaysAllowedPerMonth late days are forgiven, the rest become
  // Half-days (worth 0.5 of a day's pay).
  @IsOptional()
  @IsInt()
  @Min(0)
  lateThresholdMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lateDaysAllowedPerMonth?: number;
}
