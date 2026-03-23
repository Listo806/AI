import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SiteAssistTurnDto {
  @ApiPropertyOptional({ description: 'Existing session (omit on first visit)' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiProperty({ enum: ['en', 'es', 'pt'], description: 'UI language (from marketplace_lang)' })
  @IsString()
  @IsIn(['en', 'es', 'pt'])
  locale!: 'en' | 'es' | 'pt';

  @ApiPropertyOptional({ description: 'User-typed message' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;

  @ApiPropertyOptional({ description: 'Button id from previous response' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  actionId?: string;
}
