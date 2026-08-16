import { IsOptional, IsString, IsUUID, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class CreateCsEscalationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() trigger?: string;

  @IsOptional() @Transform(emptyToUndefined) @Type(() => Number) @IsInt() @Min(0) @Max(2000000000)
  thresholdMins?: number;

  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() target?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}

export class UpdateCsEscalationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() trigger?: string;

  @IsOptional() @Transform(emptyToUndefined) @Type(() => Number) @IsInt() @Min(0) @Max(2000000000)
  thresholdMins?: number;

  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() target?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
