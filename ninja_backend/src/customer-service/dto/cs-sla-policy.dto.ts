import { IsOptional, IsString, IsUUID, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class CreateCsSlaPolicyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() category?: string;

  @IsOptional() @Transform(emptyToUndefined) @Type(() => Number) @IsInt() @Min(0) @Max(2000000000)
  firstResponseTargetMins?: number;

  @IsOptional() @Transform(emptyToUndefined) @Type(() => Number) @IsInt() @Min(0) @Max(2000000000)
  resolutionTargetMins?: number;

  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}

export class UpdateCsSlaPolicyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() category?: string;

  @IsOptional() @Transform(emptyToUndefined) @Type(() => Number) @IsInt() @Min(0) @Max(2000000000)
  firstResponseTargetMins?: number;

  @IsOptional() @Transform(emptyToUndefined) @Type(() => Number) @IsInt() @Min(0) @Max(2000000000)
  resolutionTargetMins?: number;

  @IsOptional() @IsBoolean() active?: boolean;
}
