import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class CreateCsAutomationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() trigger?: string;
  @IsOptional() @IsString() conditions?: string;
  @IsOptional() @IsString() actions?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}

export class UpdateCsAutomationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() trigger?: string;
  @IsOptional() @IsString() conditions?: string;
  @IsOptional() @IsString() actions?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
