import {
  IsOptional, IsString, IsUUID, IsNumber, IsDateString, Min, Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

// A conversion is an explicit, real event. leadId/contactId are validated as UUIDs
// and ownership-checked server-side. idempotencyKey makes webhook/retried writes
// safe — the same key never double-counts.
export class CreateMktConversionDto {
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() leadId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() contactId?: string;
  @IsOptional() @IsString() conversionType?: string;

  @IsOptional() @Transform(emptyToUndefined) @Type(() => Number) @IsNumber() @Min(0) @Max(999999999999.99)
  value?: number;

  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() idempotencyKey?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() occurredAt?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() teamId?: string;
}
