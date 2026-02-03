import { IsString, IsNotEmpty, IsUUID, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendWhatsAppDto {
  @ApiProperty({ description: 'Lead ID' })
  @IsUUID()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({ description: 'Message text' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Sender: platform (default) or agent', enum: ['platform', 'agent'] })
  @IsOptional()
  @IsIn(['platform', 'agent'])
  senderType?: 'platform' | 'agent';

  @ApiPropertyOptional({ description: 'Conversation ID (for conversation-scoped send)' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
