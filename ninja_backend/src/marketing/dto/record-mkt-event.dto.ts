import { IsOptional, IsString, IsUUID, IsIn, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' ? undefined : value;

// A real message event, as a provider webhook would post it. dedupKey makes it
// idempotent so a retried delivery never inflates opens/clicks.
export class RecordMktEventDto {
  @IsIn(['delivered', 'open', 'click', 'bounce', 'unsubscribe', 'complaint', 'spam', 'failed'])
  eventType!: string;

  @IsOptional() @Transform(emptyToUndefined) @IsUUID() recipientId?: string;
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsString() dedupKey?: string;

  @IsOptional() @Transform(emptyToUndefined) @IsDateString() occurredAt?: string;
}
