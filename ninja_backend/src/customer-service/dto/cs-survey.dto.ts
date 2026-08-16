import { IsOptional, IsString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

export class CreateCsSurveyDto {
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() ticketId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() contactId?: string;
  @IsOptional() @IsString() customerName?: string;

  @IsOptional() @Transform(emptyToUndefined) @Type(() => Number) @IsInt() @Min(1) @Max(5)
  rating?: number;

  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}

export class UpdateCsSurveyDto {
  @IsOptional() @Transform(emptyToUndefined) @Type(() => Number) @IsInt() @Min(1) @Max(5)
  rating?: number;

  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() customerName?: string;
}
