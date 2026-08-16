import { IsOptional, IsString, IsIn } from 'class-validator';

// A ticket message. message_type is constrained to the known kinds; internal_note
// is agent-only and must never be surfaced on a customer-facing channel.
export class CreateCsMessageDto {
  @IsString() body!: string;

  @IsOptional()
  @IsIn(['customer', 'agent', 'internal_note', 'system'])
  messageType?: string;

  @IsOptional() @IsString() authorName?: string;
}
