import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

// Apply an automation to a specific entity, once. entityId is ownership-checked and
// dedupKey makes the run idempotent (no duplicate action / no duplicate send).
export class RunMktAutomationDto {
  @IsOptional() @IsString() entityType?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsUUID() entityId?: string;
  @IsOptional() @IsString() dedupKey?: string;
}
