import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PriorMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  body!: string;
}

/** Stateful turn for CRM / authenticated clients; same engine as public site assist. */
export class ConversationAssistTurnDto {
  @ApiPropertyOptional({ description: 'Client correlation id (defaults to crm:userId)' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sessionId?: string;

  @ApiProperty({ enum: ['en', 'es', 'pt'] })
  @IsString()
  @IsIn(['en', 'es', 'pt'])
  locale!: 'en' | 'es' | 'pt';

  @ApiProperty({ description: 'Conversation funnel state from previous response' })
  @IsObject()
  state!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  actionId?: string;

  @ApiProperty({ type: [PriorMessageDto], description: 'Recent chat without the current user line' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriorMessageDto)
  priorMessages!: PriorMessageDto[];
}
